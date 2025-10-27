/**
 * QR Code Modal Component
 * Displays QR codes for wallet addresses and other data
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: string;
  description?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  open,
  onClose,
  title,
  data,
  description
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 2
          }}
        >
          {/* QR Code placeholder - in a real implementation, you'd use a QR code library */}
          <Box
            sx={{
              width: 200,
              height: 200,
              border: '2px solid #ccc',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              QR Code
            </Typography>
          </Box>
          
          {description && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {description}
            </Typography>
          )}
          
          <Typography
            variant="body2"
            sx={{
              wordBreak: 'break-all',
              textAlign: 'center',
              backgroundColor: '#f5f5f5',
              p: 1,
              borderRadius: 1,
              fontFamily: 'monospace'
            }}
          >
            {data}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};