interface FrameData {
  address?: string | undefined;
  buttonIndex?: 1 | 2 | 3 | 4 | undefined;
  castId: {
    fid: number;
    hash: string;
  };
  fid: number;
  inputText?: string | undefined;
  messageHash: string;
  network: number;
  state?: string | undefined;
  timestamp: number;
  transactionId?: `0x${string}` | undefined;
  url: string;
}
