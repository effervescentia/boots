import { client as webauthn } from "@passwordless-id/webauthn";
import { DOMAIN } from "@web/app/app.const";
import { routes } from "@web/app/app.router";
import { client } from "@web/client";
import { accountAtom } from "@web/data/account.atom";
import { preferredCredentialAtom } from "@web/data/preferred-credential.atom";
import { hasPublicKeySignalAPI } from "@web/utils/capability.util";
import { Invariant } from "@web/utils/error.util";
import { unpack } from "@web/utils/request.util";
import { useSetAtom } from "jotai";

export const Signup: React.FC = () => {
  const setAccount = useSetAtom(accountAtom);
  const setPreferredCredential = useSetAtom(preferredCredentialAtom);

  const signup = async () => {
    const { challenge } = await client()
      .auth.signup.negotiate.post({})
      .then(unpack);

    const registration = await webauthn.register({
      hints: ["client-device"],
      userVerification: "required",
      user: "boots",
      challenge,
      domain: DOMAIN,
      timeout: 50_000,
    });

    if (!registration.user.id)
      throw new Invariant("credential did not yield user");

    const result = await client()
      .auth.signup.verify.post({ registration })
      .then(unpack)
      .catch(async (err) => {
        if (hasPublicKeySignalAPI(PublicKeyCredential)) {
          await PublicKeyCredential.signalUnknownCredential({
            credentialId: registration.id,
            rpId: DOMAIN,
          });
        }

        throw err;
      });

    setPreferredCredential({
      id: registration.id,
      transports: registration.response.transports,
    });

    const { account } = result;
    const [alias] = account.aliases;

    if (!alias) throw new Invariant("account created without alias");

    if (hasPublicKeySignalAPI(PublicKeyCredential)) {
      await PublicKeyCredential.signalCurrentUserDetails({
        userId: btoa(registration.user.id),
        rpId: DOMAIN,
        name: alias.name,
        displayName: alias.name,
      });
    }

    setAccount({
      id: account.id,
      aliases: account.aliases.map(({ name }) => name),
    });

    routes.home().replace();
  };

  return (
    <div>
      <button type="button" onClick={signup}>
        signup
      </button>
      <a {...routes.login().link}>login</a>
    </div>
  );
};
