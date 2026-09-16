export type Screen = 'login' | 'register' | 'recovery' | 'home';

export type Notice = { text: string; error?: boolean } | null;

export type NotifyFn = (text: string, error?: boolean) => void;
