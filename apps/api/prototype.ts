
interface Account {
  id: string;
  username: string; // unique, auto-generated
  child: boolean; // denotes a child account, must be part of a family
  family: Family | null;
}

// additional security should be employed to protect this information
interface Profile {
  id: string;
  account: Account; // accounts can only have one profile
  name: string;
}

interface Family {
  id: string;
  name: string;
  guardians: Account[]; // guardians have access to additional security tools
}

interface TrustNetwork {
  id: string;
  name: string;
  accounts: Account[];
  leaders: Account[];
}
