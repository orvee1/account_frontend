'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { server, responseData } from "@/services/server";

export default function SalesConfiguration() {
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({
        sales_show_price_uom: true,
        sales_show_trade_discount: true,
        sales_show_line_discount: true,
        sales_show_vat: true,
        sales_show_ait: true,
        sales_show_cogs: false,
        sales_show_gross_profit: false,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const response = await server.get('/settings/sales-form-config');
            const result = await responseData(response);
            if (result.ok) {
                setSettings(result.data);
            } else {
                toast({ title: "Error", description: "Failed to load sales configuration", variant: "destructive" });
            }
        } catch (error) {
            console.error('Error loading sales settings:', error);
            toast({ title: "Error", description: "Failed to load sales configuration", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (key, checked) => {
        setSettings(prev => ({ ...prev, [key]: checked }));
    };

    const handleSave = async () => {
        try {
            const response = await server.post('/settings/sales-form-config', settings);
            const result = await responseData(response);
            if (result.ok) {
                toast({ title: "Success", description: "Sales configuration saved successfully" });
            } else {
                toast({ title: "Error", description: result.data?.message || "Failed to save configuration", variant: "destructive" });
            }
        } catch (error) {
            console.error('Error saving sales settings:', error);
            toast({ title: "Error", description: "Failed to save sales configuration", variant: "destructive" });
        }
    };

    if (isLoading) return <div>Loading sales settings...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Configuration</CardTitle>
                <CardDescription>Configure column visibility for the sales invoice form. These settings apply company-wide.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sales_show_price_uom" className="text-base font-semibold">Show Price UOM</Label>
                            <p className="text-sm text-gray-500">Allow selecting a different UOM for pricing than the sale quantity UOM.</p>
                        </div>
                        <Switch
                            id="sales_show_price_uom"
                            checked={settings.sales_show_price_uom}
                            onCheckedChange={(checked) => handleToggle('sales_show_price_uom', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sales_show_trade_discount" className="text-base font-semibold">Show Trade Discount</Label>
                            <p className="text-sm text-gray-500">Enable line-level trade discount percentage field.</p>
                        </div>
                        <Switch
                            id="sales_show_trade_discount"
                            checked={settings.sales_show_trade_discount}
                            onCheckedChange={(checked) => handleToggle('sales_show_trade_discount', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sales_show_line_discount" className="text-base font-semibold">Show Line Discount</Label>
                            <p className="text-sm text-gray-500">Enable line-level secondary discount field.</p>
                        </div>
                        <Switch
                            id="sales_show_line_discount"
                            checked={settings.sales_show_line_discount}
                            onCheckedChange={(checked) => handleToggle('sales_show_line_discount', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sales_show_vat" className="text-base font-semibold">Show VAT</Label>
                            <p className="text-sm text-gray-500">Enable VAT rate and amount columns in the invoice form.</p>
                        </div>
                        <Switch
                            id="sales_show_vat"
                            checked={settings.sales_show_vat}
                            onCheckedChange={(checked) => handleToggle('sales_show_vat', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sales_show_ait" className="text-base font-semibold">Show AIT</Label>
                            <p className="text-sm text-gray-500">Enable Advance Income Tax columns.</p>
                        </div>
                        <Switch
                            id="sales_show_ait"
                            checked={settings.sales_show_ait}
                            onCheckedChange={(checked) => handleToggle('sales_show_ait', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                        <div>
                            <Label htmlFor="sales_show_cogs" className="text-base font-semibold">Show COGS (Internal)</Label>
                            <p className="text-sm text-gray-500">Show Cost of Goods Sold for each line item (for internal use only).</p>
                        </div>
                        <Switch
                            id="sales_show_cogs"
                            checked={settings.sales_show_cogs}
                            onCheckedChange={(checked) => handleToggle('sales_show_cogs', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sales_show_gross_profit" className="text-base font-semibold">Show Gross Profit (Internal)</Label>
                            <p className="text-sm text-gray-500">Show estimated gross profit for each line and total invoice.</p>
                        </div>
                        <Switch
                            id="sales_show_gross_profit"
                            checked={settings.sales_show_gross_profit}
                            onCheckedChange={(checked) => handleToggle('sales_show_gross_profit', checked)}
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave}>Save Sales Configuration</Button>
            </CardFooter>
        </Card>
    );
}
