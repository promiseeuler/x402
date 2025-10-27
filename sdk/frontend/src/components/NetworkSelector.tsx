/**
 * Network Selector Component
 * Allows users to switch between different blockchain networks
 */

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { NetworkName } from '../../../src/types/network';

interface NetworkSelectorProps {
  currentNetwork: NetworkName;
  onNetworkChange: (network: NetworkName) => void;
  disabled?: boolean;
}

const AVAILABLE_NETWORKS: { value: NetworkName; label: string }[] = [
  { value: 'SOMNIA_TESTNET', label: 'Somnia Testnet' },
  { value: 'ETHEREUM_MAINNET', label: 'Ethereum Mainnet' },
  { value: 'ETHEREUM_SEPOLIA', label: 'Ethereum Sepolia' },
  { value: 'POLYGON_MAINNET', label: 'Polygon Mainnet' },
  { value: 'BASE_MAINNET', label: 'Base Mainnet' },
  { value: 'BASE_SEPOLIA', label: 'Base Sepolia' },
  { value: 'ARBITRUM_MAINNET', label: 'Arbitrum Mainnet' }
];

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  currentNetwork,
  onNetworkChange,
  disabled = false
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onNetworkChange(event.target.value as NetworkName);
  };

  return (
    <FormControl size="small" disabled={disabled} sx={{ minWidth: 200 }}>
      <InputLabel>Network</InputLabel>
      <Select
        value={currentNetwork}
        label="Network"
        onChange={handleChange}
      >
        {AVAILABLE_NETWORKS.map((network) => (
          <MenuItem key={network.value} value={network.value}>
            {network.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};