import React, { useState, useEffect } from 'react';
import { useAccount, useDeployContract, useWaitForTransactionReceipt } from 'wagmi';
import { FACTORY_ABI, FACTORY_BYTECODE } from '../config/factoryArtifact';
import { APP_CONFIG } from '../config/constants';
import { AlertCircle, Rocket, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

type DeployState = 'Ready' | 'Waiting For Signature' | 'Pending Transaction' | 'Confirmed';

export const AdminDeploy: React.FC = () => {
  console.log('Runtime VITE_ADMIN_WALLET_ADDRESS:', import.meta.env.VITE_ADMIN_WALLET_ADDRESS);
  const { address, isConnected, chainId, chain } = useAccount();
  const { deployContractAsync } = useDeployContract();
  
  const [deployState, setDeployState] = useState<DeployState>('Ready');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [factoryAddress, setFactoryAddress] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = isConnected && address && APP_CONFIG.ADMIN_WALLET_ADDRESS 
    ? address.toLowerCase() === APP_CONFIG.ADMIN_WALLET_ADDRESS.toLowerCase()
    : false;

  const isCorrectNetwork = chainId === 5042002;

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  useEffect(() => {
    if (txHash && isConfirming) {
      setDeployState('Pending Transaction');
    }
  }, [txHash, isConfirming]);

  useEffect(() => {
    if (isConfirmed && receipt) {
      setDeployState('Confirmed');
      if (receipt.contractAddress) {
        setFactoryAddress(receipt.contractAddress);
      }
    }
  }, [isConfirmed, receipt]);

  const handleDeploy = async () => {
    setError(null);
    setDeployState('Waiting For Signature');

    try {
      const hash = await deployContractAsync({
        abi: FACTORY_ABI,
        bytecode: FACTORY_BYTECODE as `0x${string}`,
      });
      
      setTxHash(hash);
    } catch (err: any) {
      console.error(err);
      setError(err.shortMessage || err.message || 'Deployment failed.');
      setDeployState('Ready');
    }
  };

  if (!isConnected || !isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-2xl flex flex-col items-center text-center max-w-md w-full">
          <Lock size={48} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">Unauthorized</h2>
          <p className="text-muted mb-6">
            Only a predefined admin wallet address can access deployment actions.
          </p>
          
          <div className="w-full bg-sidebar p-4 rounded-xl border border-border/80 text-left mb-6 space-y-3">
            <div>
              <span className="text-xs text-muted block mb-1">Connected Wallet:</span>
              <span className="text-sm text-accent font-mono break-all">
                {isConnected ? address : 'Not Connected'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block mb-1">Admin Wallet (Configured):</span>
              <span className="text-sm text-text font-mono break-all">
                {APP_CONFIG.ADMIN_WALLET_ADDRESS || 'Undefined in .env'}
              </span>
            </div>
          </div>
          
          {!isConnected && (
            <p className="text-sm text-accent">Please connect your wallet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 md:px-10 py-10 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2 flex items-center">
          <Rocket className="mr-3 text-[#7C3AED]" />
          Admin: Deploy Factory
        </h1>
        <p className="text-muted">Deploy the ArcMemeFactory directly to Arc Testnet.</p>
      </div>

      <div className="glassmorphism-light p-8 rounded-2xl border border-border/50 space-y-6 relative overflow-hidden">
        {/* Status UI */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <span className="text-muted">Connected Wallet</span>
            <span className="text-text font-mono font-bold text-sm">{address}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <span className="text-muted">Network Name</span>
            <span className={`font-bold ${isCorrectNetwork ? 'text-[#10B981]' : 'text-red-500'}`}>
              {chain?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <span className="text-muted">Chain ID</span>
            <span className={`font-bold font-mono ${isCorrectNetwork ? 'text-[#10B981]' : 'text-red-500'}`}>
              {chainId}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-cardLight px-4 rounded-xl border border-border/50">
            <span className="text-muted">Deployment Status</span>
            <span className="text-accent font-bold text-lg">{deployState}</span>
          </div>
        </div>

        {!isCorrectNetwork && (
          <div className="flex items-center text-red-400 bg-red-400/10 p-4 rounded-xl text-sm font-medium">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            Please switch to Arc Testnet.
          </div>
        )}

        {error && (
          <div className="flex items-center text-red-400 bg-red-400/10 p-4 rounded-xl text-sm break-words">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {!factoryAddress ? (
          <button 
            onClick={handleDeploy}
            disabled={!isCorrectNetwork || deployState !== 'Ready'}
            className={`w-full py-4 rounded-xl text-lg mt-4 flex justify-center items-center font-bold transition-all ${
              !isCorrectNetwork || deployState !== 'Ready'
                ? 'bg-border text-muted cursor-not-allowed border border-border/80'
                : 'glow-btn-primary'
            }`}
          >
            {deployState === 'Waiting For Signature' && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            )}
            {deployState === 'Pending Transaction' && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            )}
            {deployState === 'Ready' ? 'Deploy ArcMemeFactory' : deployState}
          </button>
        ) : (
          <div className="mt-8 p-6 bg-[#10B981]/10 border border-[#10B981] rounded-xl animate-fadeIn text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#10B981] to-[#059669] rounded-full mx-auto flex items-center justify-center mb-4 shadow-md">
              <CheckCircle2 size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-text">Factory Address Generated</h3>
            
            <div className="pt-4 border-t border-[#10B981]/30 text-left space-y-3">
              <div>
                <span className="text-muted text-sm block mb-1">Factory Address</span>
                <span className="text-[#10B981] font-mono font-bold break-all bg-sidebar px-3 py-2 rounded-lg block border border-[#10B981]/50">
                  {factoryAddress}
                </span>
              </div>
              
              <div>
                <span className="text-muted text-sm block mb-1">Transaction Hash</span>
                <span className="text-accent font-mono text-xs break-all bg-sidebar px-3 py-2 rounded-lg block border border-border/80">
                  {txHash}
                </span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <a 
                href={`https://testnet.arcscan.app/address/${factoryAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl border border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10 transition-colors font-bold flex items-center justify-center"
              >
                <ExternalLink size={16} className="mr-2" /> View Contract
              </a>
              <a 
                href={`https://testnet.arcscan.app/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl border border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-colors font-bold flex items-center justify-center"
              >
                <ExternalLink size={16} className="mr-2" /> View TX
              </a>
            </div>

            <div className="mt-4 p-4 bg-sidebar rounded-xl border border-primary/50 text-left">
              <h4 className="text-text font-bold mb-2 flex items-center">
                <AlertCircle size={16} className="text-primary mr-2" /> Next Step
              </h4>
              <p className="text-muted text-sm">
                Update <code className="text-text bg-border/80 px-1.5 py-0.5 rounded">ARC_MEME_FACTORY_ADDRESS</code> in <code className="text-text bg-border/80 px-1.5 py-0.5 rounded">src/config/contracts.ts</code> with this value.
              </p>
            </div>
            
            <Link to="/" className="block mt-4 text-muted hover:text-text text-sm underline underline-offset-4">
              Return to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
