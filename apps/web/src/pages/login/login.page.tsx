import { client as webauthn } from '@passwordless-id/webauthn';
import { DOMAIN } from '@web/app/app.const';
import { routes } from '@web/app/app.router';
import { client } from '@web/client';
import { accountAtom } from '@web/data/account.atom';
import { preferredCredentialAtom } from '@web/data/preferred-credential.atom';
import { hasPublicKeySignalAPI } from '@web/utils/capability.util';
import { unpack } from '@web/utils/request.util';
import { useAtom, useSetAtom } from 'jotai';

export const Login: React.FC = () => {
  const setAccount = useSetAtom(accountAtom);
  const [preferredCredential, setPreferredCredential] = useAtom(preferredCredentialAtom);

  const login = async () => {
    const { challenge } = await client().auth.web.login.negotiate.post({}).then(unpack);

    const authentication = await webauthn.authenticate({
      hints: ['client-device'],
      userVerification: 'required',
      allowCredentials: preferredCredential ? [preferredCredential] : undefined,
      challenge,
      domain: DOMAIN,
      timeout: 90_000,
    });

    const { account } = await client()
      .auth.web.login.verify.post({ authentication })
      .then(unpack)
      .catch(async (err) => {
        setPreferredCredential(null);

        if (hasPublicKeySignalAPI(PublicKeyCredential)) {
          await PublicKeyCredential.signalUnknownCredential({
            credentialId: authentication.id,
            rpId: DOMAIN,
          });
        }

        throw err;
      });

    const [alias] = account.aliases;
    if (!alias) return;

    const credentialUserID = authentication.response.userHandle;
    if (hasPublicKeySignalAPI(PublicKeyCredential) && credentialUserID) {
      await PublicKeyCredential.signalCurrentUserDetails({
        userId: credentialUserID,
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
      <button type="button" onClick={login}>
        login
      </button>
      <a {...routes.signup().link}>signup</a>
    </div>
  );
};
