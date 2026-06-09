import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, PlusCircle, AlertCircle, X, Check, ExternalLink, Rocket } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { APP_CONFIG } from '../config/constants';
import { type MemeAsset } from '../types';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, decodeEventLog, erc20Abi } from 'viem';
import { ARC_MEME_FACTORY_ABI, ARC_MEME_FACTORY_ADDRESS, ARC_NATIVE_USDC } from '../config/contracts';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, errorInfo: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("[ErrorBoundary Caught]:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-white bg-red-900/50 rounded-xl m-10 border border-red-500">
          <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
          <pre className="text-xs font-mono whitespace-pre-wrap text-red-200">{this.state.error && this.state.error.toString()}</pre>
          <pre className="text-xs font-mono whitespace-pre-wrap text-red-200 mt-4">{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export const CreateToken: React.FC = () => {
  const { assets, isWalletConnected, usdcBalance, addToken, currentUser, walletAddress } = useAppContext();
  
  const [tokenName, setTokenName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [totalSupply, setTotalSupply] = useState('1000000000');
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);
  const [createdTokenAddress, setCreatedTokenAddress] = useState('');
  
  // Wagmi hooks for real deployment
  const { writeContract, writeContractAsync, data: txHash } = useWriteContract();

  const receiptState = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = receiptState;
  const publicClient = usePublicClient();

  // Watch for transaction confirmation and parse event logs
  const processedTxRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (isConfirmed && receipt && step !== 'success') {
      if (processedTxRef.current === receipt.transactionHash) return;
      processedTxRef.current = receipt.transactionHash;
      try {
        let newAddress = '';
        for (const log of receipt.logs) {
          try {
            const decodedLog = decodeEventLog({
              abi: ARC_MEME_FACTORY_ABI,
              data: log.data,
              topics: log.topics,
            });
            
            if (decodedLog.eventName === 'TokenCreated') {
              const args = decodedLog.args as any;
              newAddress = args.token;
              const marketAddress = args.market;

              if (newAddress) {
                setCreatedTokenAddress(newAddress);
                const newToken: MemeAsset = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: tokenName,
                  symbol: symbol,
                  contractAddress: newAddress,
                  marketAddress: marketAddress,
                  logo: logoPreview || '🚀',
                  category: 'Community',
                  verificationStatus: 'New',
                  description: description,
                  creatorName: currentUser?.displayName || 'Unknown',
                  creatorHandle: walletAddress || '0x...',
                  creatorAvatar: currentUser?.avatarSeed || '👤',
                  likes: 0,
                  views: 0,
                  rank: assets.length + 1,
                  hotness: 0,
                  followers: 0,
                  launchDate: new Date().toISOString(),
                  // Default stats (will be updated by sync)
                  marketCap: 0,
                  liquidity: 0,
                  holderCount: 1,
                  volume24h: 0,
                  price: 0,
                  txHash: receipt.transactionHash,
                };
                console.log("TOKEN CREATE START");
                console.log("TOKEN OBJECT", newToken);
                
                addToken(newToken);
                
                setStep('success');
              }
              break;
            }
          } catch (e) {
            // Not a matching log, ignore
          }
        }
      } catch (err) {
        console.error('[CreateToken] Crash inside confirmation effect:', err);
        setError('Transaction succeeded, but frontend crashed while parsing the receipt.');
      }
    }
  }, [isConfirmed, receipt, step, addToken, assets.length, currentUser, description, logoPreview, symbol, tokenName, walletAddress]);

  const isDuplicateSymbol = assets.some(
    (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase()
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 128;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const webpData = canvas.toDataURL('image/webp', 0.8);
            setLogoPreview(webpData);
          } else {
            setLogoPreview(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalletConnected) {
      setError('Please connect your wallet first.');
      return;
    }
    if (!logoPreview) {
      setError('Please upload a token logo.');
      return;
    }
    if (!tokenName.trim()) {
      setError('Please enter a valid token name.');
      return;
    }
    if (!symbol.trim()) {
      setError('Please enter a valid token symbol.');
      return;
    }
    if (!totalSupply || parseFloat(totalSupply) <= 0) {
      setError('Please enter a valid total supply.');
      return;
    }
    if (isDuplicateSymbol) {
      setError('This symbol is already taken. Please choose another.');
      return;
    }
    const balanceNum = usdcBalance ? parseFloat(usdcBalance) : 0;
    if (balanceNum < APP_CONFIG.TOKEN_CREATION_FEE_USDC) {
      setError('Insufficient USDC balance to pay the creation fee.');
      return;
    }

    setError(null);
    setStep('confirm'); // Move to confirmation step
  };

  const handleFinalDeploy = async () => {
    if ((ARC_MEME_FACTORY_ADDRESS as string) === '0x0000000000000000000000000000000000000000') {
      setError('Smart contract integration is pending. Please configure the factory address in src/config/contracts.ts after deployment.');
      return;
    }

    try {
      const usdcSeed = parseUnits(APP_CONFIG.TOKEN_CREATION_FEE_USDC.toString(), 6);
      
      if (publicClient && walletAddress) {
        try {
          await publicClient.simulateContract({
            address: ARC_MEME_FACTORY_ADDRESS,
            abi: ARC_MEME_FACTORY_ABI,
            functionName: 'createToken',
            args: [tokenName, symbol, usdcSeed],
            account: walletAddress as `0x${string}`,
          });
        } catch (simError: any) {
          if (simError.message && simError.message.includes('Symbol already exists')) {
            setError('Symbol already exists. Choose a different ticker.');
            return;
          }
        }
      }

      const approveHash = await writeContractAsync({
        address: ARC_NATIVE_USDC as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [ARC_MEME_FACTORY_ADDRESS as `0x${string}`, usdcSeed]
      });
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      writeContract({
        address: ARC_MEME_FACTORY_ADDRESS,
        abi: ARC_MEME_FACTORY_ABI,
        functionName: 'createToken',
        args: [tokenName, symbol, usdcSeed],
      });
    } catch (err: any) {
      console.error('Deployment failed:', err);
      setError(err.shortMessage || 'Transaction failed or was rejected.');
    }
  };

  const resetForm = () => {
    setStep('form');
    setTokenName('');
    setSymbol('');
    setDescription('');
    setTotalSupply('1000000000');
    setLogoPreview(null);
  };

  const renderSuccess = () => {
    return (
      <div className="glassmorphism-light p-8 rounded-2xl border border-[#10B981] shadow-[0_0_40px_rgba(16,185,129,0.15)] max-w-lg mx-auto text-center opacity-100 transition-opacity duration-300">
        <div className="w-20 h-20 bg-gradient-to-tr from-[#10B981] to-[#059669] rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
          <Rocket size={40} className="text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-text mb-2">Token Created Successfully</h2>
        <p className="text-muted mb-8">Your asset is now live on the Arc Testnet.</p>
        
        <div className="bg-cardLight rounded-xl p-6 border border-border mb-8 text-left space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Token Logo</span>
            <span className="text-3xl">{logoPreview ? <img src={logoPreview} alt="Logo" className="w-8 h-8 rounded-full object-cover" /> : '🚀'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Token Name</span>
            <span className="text-text font-bold">{tokenName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Symbol</span>
            <span className="text-[#06B6D4] font-bold font-mono">{symbol}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Total Supply</span>
            <span className="text-text font-bold">{parseInt(totalSupply).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Creator Name</span>
            <span className="text-text">{currentUser?.displayName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Creator Wallet</span>
            <span className="text-text text-xs font-mono">{walletAddress}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Status</span>
            <span className="text-[#10B981] font-bold flex items-center bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded text-xs uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse"></span>
              NEW
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Creation Time</span>
            <span className="text-text">{new Date().toLocaleString()}</span>
          </div>
          <div className="pt-3 mt-3 border-t border-border/50">
            <span className="text-muted text-xs block mb-1">Contract Address</span>
            <span className="text-[#06B6D4] text-xs font-mono break-all">{createdTokenAddress}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link 
            to={`/token/${createdTokenAddress}`}
            className="w-full glow-btn-primary py-3.5 rounded-xl font-bold flex items-center justify-center"
          >
            <ExternalLink size={18} className="mr-2" /> View Token
          </Link>
          
          {(ARC_MEME_FACTORY_ADDRESS as string) !== '0x0000000000000000000000000000000000000000' && (
            <a 
              href={`https://testnet.arcscan.app/token/${createdTokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl border border-[#06B6D4] text-[#06B6D4] hover:bg-[rgba(6,182,212,0.1)] transition-colors font-bold flex items-center justify-center"
            >
              View On ArcScan
            </a>
          )}
          
          <div className="flex space-x-3">
            <Link 
              to="/"
              className="flex-1 py-3.5 rounded-xl border border-border text-text hover:bg-cardLight transition-colors font-semibold"
            >
              Dashboard
            </Link>
            <button 
              onClick={resetForm}
              className="flex-1 py-3.5 rounded-xl border border-border text-text hover:bg-cardLight transition-colors font-semibold"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex-1 px-6 md:px-10 py-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2 flex items-center">
            <PlusCircle className="mr-3 text-accent" />
            Create New Token
          </h1>
          <p className="text-muted">Deploy your meme token to the Arc network.</p>
        </div>

        {step === 'form' && (
          <form onSubmit={handleInitialSubmit} className="space-y-6 glassmorphism-light p-8 rounded-2xl border border-border relative">
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Token Name</label>
                  <input 
                    type="text" 
                    required
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g. ArcPepe" 
                    className="w-full bg-cardLight border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Symbol</label>
                  <input 
                    type="text" 
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. APEPE" 
                    className={`w-full bg-cardLight border rounded-xl px-4 py-3 text-text focus:outline-none transition-colors uppercase ${
                      isDuplicateSymbol ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-accent'
                    }`}
                  />
                  {isDuplicateSymbol && (
                    <p className="text-red-500 text-xs mt-1">Symbol is already in use.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">Description</label>
                <textarea 
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the community about your token..." 
                  className="w-full bg-cardLight border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">Total Supply</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(e.target.value)}
                  className="w-full bg-cardLight border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">Token Logo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                {!logoPreview ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      isDragging 
                        ? 'border-accent bg-accent/10 text-accent' 
                        : 'border-border bg-cardLight text-muted hover:border-accent hover:text-accent'
                    }`}
                  >
                    <Upload size={32} className="mb-3" />
                    <p className="font-medium text-center">Click to upload or drag and drop</p>
                    <p className="text-xs mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
                  </div>
                ) : (
                  <div className="relative inline-block border border-border rounded-xl overflow-hidden bg-cardLight">
                    <img src={logoPreview} alt="Logo Preview" className="h-32 w-32 object-cover" />
                    <button 
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center text-red-400 bg-red-400/10 p-3 rounded-xl text-sm">
                <AlertCircle size={16} className="mr-2" /> {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full glow-btn-primary py-4 rounded-xl text-lg mt-4 flex justify-center items-center font-bold"
            >
              Deploy Token
            </button>
          </form>
        )}

        {step === 'confirm' && (
          <div className="glassmorphism-light p-8 rounded-2xl border border-accent shadow-[0_0_30px_rgba(6,182,212,0.1)] max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-text mb-6 text-center">Confirm Deployment</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted">Token Name</span>
                <span className="text-text font-bold">{tokenName}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted">Symbol</span>
                <span className="text-[#06B6D4] font-mono font-bold">{symbol}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted">Total Supply</span>
                <span className="text-text font-bold">{parseInt(totalSupply).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-cardLight px-4 rounded-xl border border-border/50">
                <span className="text-muted">Creation Fee</span>
                <span className="text-[#10B981] font-bold text-lg">{APP_CONFIG.TOKEN_CREATION_FEE_USDC} USDC</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => setStep('form')}
                className="flex-1 py-3.5 rounded-xl border border-border text-muted hover:text-text hover:bg-cardLight transition-all font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleFinalDeploy}
                disabled={isConfirming}
                className={`flex-1 py-3.5 rounded-xl text-white transition-all font-bold flex items-center justify-center ${
                  isConfirming 
                    ? 'bg-[#1E293B] cursor-not-allowed opacity-70' 
                    : 'bg-gradient-to-r from-[#10B981] to-[#059669] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                }`}
              >
                {isConfirming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Deploying...
                  </>
                ) : (
                  <>
                    <Check size={18} className="mr-2" /> Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && renderSuccess()}
      </div>
    </ErrorBoundary>
  );
};
