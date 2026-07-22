import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const AssetDisposal = ({ assets, disposeAsset }) => {
  const [selectedAsset, setSelectedAsset] = useState('');
  const [disposalType, setDisposalType] = useState('Sold');
  const [disposalValue, setDisposalValue] = useState('');
  const [tagNo, setTagNo] = useState('');

  const handleAssetSelect = (assetId) => {
    setSelectedAsset(assetId);
    const asset = assets.find(a => a.id === parseInt(assetId));
    if (asset && asset.tagNo) {
      setTagNo(asset.tagNo);
    } else {
      setTagNo('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAsset) {
      disposeAsset(selectedAsset, disposalType, disposalValue, tagNo);
      setSelectedAsset('');
      setDisposalType('Sold');
      setDisposalValue('');
      setTagNo('');
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="asset">Select Asset</Label>
            <Select onValueChange={handleAssetSelect} value={selectedAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Select an asset to dispose" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id.toString()}>
                    {asset.name} {asset.tagNo ? `(${asset.tagNo})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tagNo">Tag No</Label>
            <Input
              id="tagNo"
              type="text"
              value={tagNo}
              readOnly
              placeholder="Auto-filled Tag No"
            />
          </div>
          <div>
            <Label htmlFor="disposalType">Disposal Type</Label>
            <Select onValueChange={setDisposalType} value={disposalType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sold">Sold</SelectItem>
                <SelectItem value="Scrapped">Scrapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="number"
              value={disposalValue}
              onChange={(e) => setDisposalValue(e.target.value)}
              placeholder="Enter disposal value"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit">Dispose Asset</Button>
        </div>
      </form>
    </div>
  );
};

export default AssetDisposal;
