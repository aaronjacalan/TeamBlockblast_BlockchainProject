import { BlockfrostProvider } from "@meshsdk/core";

const apiKey = import.meta.env.VITE_BLOCKFROST_API_KEY;

if (!apiKey) {
  console.warn("Blockfrost API key is not defined in environment variables. Transactions requiring a provider might fail.");
}

export const provider = new BlockfrostProvider(apiKey || "dummy_key_to_prevent_crash");
