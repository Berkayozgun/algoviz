import { create } from 'zustand';

export type EncryptionStep = 'idle' | 'writing' | 'encrypting' | 'sending' | 'intercepted' | 'received' | 'decrypting' | 'decrypted' | 'failed';

interface CryptoState {
    // Hashing
    hashInput: string;
    hashOutput: string;
    previousHash: string;

    // Encryption
    message: string;
    encryptedMessage: string;
    decryptedMessage: string;
    encryptionStep: EncryptionStep;
    hackerIntercepted: boolean;
    isAnimating: boolean;

    // Actions
    setHashInput: (input: string) => void;
    setHashOutput: (output: string) => void;
    setPreviousHash: (hash: string) => void;
    setMessage: (message: string) => void;
    setEncryptedMessage: (message: string) => void;
    setDecryptedMessage: (message: string) => void;
    setEncryptionStep: (step: EncryptionStep) => void;
    setHackerIntercepted: (intercepted: boolean) => void;
    setIsAnimating: (animating: boolean) => void;
    resetEncryption: () => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
    hashInput: '',
    hashOutput: '',
    previousHash: '',
    message: '',
    encryptedMessage: '',
    decryptedMessage: '',
    encryptionStep: 'idle',
    hackerIntercepted: false,
    isAnimating: false,

    setHashInput: (hashInput) => set({ hashInput }),
    setHashOutput: (hashOutput) => set({ hashOutput }),
    setPreviousHash: (previousHash) => set({ previousHash }),
    setMessage: (message) => set({ message }),
    setEncryptedMessage: (encryptedMessage) => set({ encryptedMessage }),
    setDecryptedMessage: (decryptedMessage) => set({ decryptedMessage }),
    setEncryptionStep: (encryptionStep) => set({ encryptionStep }),
    setHackerIntercepted: (hackerIntercepted) => set({ hackerIntercepted }),
    setIsAnimating: (isAnimating) => set({ isAnimating }),
    resetEncryption: () => set({
        encryptedMessage: '',
        decryptedMessage: '',
        encryptionStep: 'idle',
        hackerIntercepted: false,
        isAnimating: false,
    }),
}));

// Simple SHA-256 implementation using Web Crypto API
export async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Simple "encryption" for visualization (not real crypto)
export function visualEncrypt(message: string): string {
    return btoa(message).split('').reverse().join('');
}

export function visualDecrypt(encrypted: string): string {
    try {
        return atob(encrypted.split('').reverse().join(''));
    } catch {
        return '???';
    }
}
