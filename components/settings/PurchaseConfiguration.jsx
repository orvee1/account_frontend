'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { server, responseData } from "@/services/server";

export default function PurchaseConfiguration() {
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({
        purchase_show_price_uom: true,
        purchase_show_trade_discount: true,
        purchase_show_line_discount: true,
        purchase_show_vat: true,
        purchase_show_ait: true,
        is_vat_registered: true,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const response = await server.get('/settings/purchase-form-config');
            const result = await responseData(response);
            if (result.ok) {
                setSettings(result.data);
            } else {
                toast({ title: "Error", description: "Failed to load purchase configuration", variant: "destructive" });
            }
        } catch (error) {
            console.error('Error loading purchase settings:', error);
            toast({ title: "Error", description: "Failed to load purchase configuration", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (key, checked) => {
        setSettings(prev => ({ ...prev, [key]: checked }));
    };

    const handleSave = async () => {
        try {
            const response = await server.post('/settings/purchase-form-config', settings);
            const result = await responseData(response);
            if (result.ok) {
                toast({ title: "Success", description: "Purchase configuration saved successfully" });
            } else {
                toast({ title: "Error", description: result.data?.message || "Failed to save configuration", variant: "destructive" });
            }
        } catch (error) {
            console.error('Error saving purchase settings:', error);
            toast({ title: "Error", description: "Failed to save purchase configuration", variant: "destructive" });
        }
    };

    if (isLoading) return <div>Loading purchase settings...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Purchase Configuration</CardTitle>
                <CardDescription>Configure column visibility and tax settings for the purchase bill form. These settings apply company-wide.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="is_vat_registered" className="text-base font-semibold">Company is VAT Registered</Label>
                            <p className="text-sm text-gray-500">If enabled, Input VAT is recorded as an asset. If disabled, VAT is included in inventory cost.</p>
                        </div>
                        <Switch
                            id="is_vat_registered"
                            checked={settings.is_vat_registered}
                            onCheckedChange={(checked) => handleToggle('is_vat_registered', checked)}
                        />
                    </div>
                    
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-4 uppercase tracking-wider text-muted-foreground">Form Column Visibility</h4>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="purchase_show_price_uom" className="text-base font-semibold">Show Bill Unit (Rate UOM)</Label>
                                    <p className="text-sm text-gray-500">Allow selecting a different UOM for pricing than the purchase quantity UOM.</p>
                                </div>
                                <Switch
                                    id="purchase_show_price_uom"
                                    checked={settings.purchase_show_price_uom}
                                    onCheckedChange={(checked) => handleToggle('purchase_show_price_uom', checked)}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="purchase_show_trade_discount" className="text-base font-semibold">Show Trade Discount</Label>
                                    <p className="text-sm text-gray-500">Enable line-level trade discount percentage field.</p>
                                </div>
                                <Switch
                                    id="purchase_show_trade_discount"
                                    checked={settings.purchase_show_trade_discount}
                                    onCheckedChange={(checked) => handleToggle('purchase_show_trade_discount', checked)}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="purchase_show_line_discount" className="text-base font-semibold">Show Line Discount</Label>
                                    <p className="text-sm text-gray-500">Enable line-level secondary discount field.</p>
                                </div>
                                <Switch
                                    id="purchase_show_line_discount"
                                    checked={settings.purchase_show_line_discount}
                                    onCheckedChange={(checked) => handleToggle('purchase_show_line_discount', checked)}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="purchase_show_vat" className="text-base font-semibold">Show VAT</Label>
                                    <p className="text-sm text-gray-500">Enable VAT rate and amount columns in the bill form.</p>
                                </div>
                                <Switch
                                    id="purchase_show_vat"
                                    checked={settings.purchase_show_vat}
                                    onCheckedChange={(checked) => handleToggle('purchase_show_vat', checked)}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="purchase_show_ait" className="text-base font-semibold">Show AIT</Label>
                                    <p className="text-sm text-gray-500">Enable Advance Income Tax columns.</p>
                                </div>
                                <Switch
                                    id="purchase_show_ait"
                                    checked={settings.purchase_show_ait}
                                    onCheckedChange={(checked) => handleToggle('purchase_show_ait', checked)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave}>Save Purchase Configuration</Button>
            </CardFooter>
        </Card>
    );
}
