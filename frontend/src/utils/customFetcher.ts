export class BackendProxyFetcher {
  async fetchProtocolParameters(): Promise<any> {
    const res = await fetch("/api/blockchain/protocol-parameters");
    if (!res.ok) {
      throw new Error("Failed to fetch secure protocol parameters from backend proxy.");
    }
    const p = await res.json();

    // Map Blockfrost epoch parameters to the structure required by Mesh SDK's transaction builder
    return {
      minFeeA: p.min_fee_a ?? 44,
      minFeeB: p.min_fee_b ?? 155381,
      maxBlockSize: p.max_block_size ?? 90112,
      maxTxSize: p.max_tx_size ?? 16384,
      maxBlockHeaderSize: p.max_bh_size ?? 1100,
      keyDeposit: p.key_deposit ?? "2000000",
      poolDeposit: p.pool_deposit ?? "500000000",
      decentralisationParam: p.decentralisation_param ?? 0,
      extraEntropy: p.extra_entropy ?? null,
      minUTxO: p.min_utxo ?? "4310",
      minPoolCost: p.min_pool_cost ?? "340000000",
      priceMem: p.price_mem ?? 0.0577,
      priceStep: p.price_step ?? 0.0000721,
      maxTxExMem: p.max_tx_ex_mem ?? "14000000",
      maxTxExSteps: p.max_tx_ex_steps ?? "10000000000",
      maxBlockExMem: p.max_block_ex_mem ?? "62000000",
      maxBlockExSteps: p.max_block_ex_steps ?? "40000000000",
      maxValSize: p.max_val_size ?? "5000",
      collateralPercent: p.collateral_percent ?? 150,
      maxCollateralInputs: p.max_collateral_inputs ?? 3,
      coinsPerUtxoByte: p.coins_per_utxo_size ?? p.coins_per_utxo_word ?? "4310",
      costModels: p.cost_models ?? {},
    };
  }
}
