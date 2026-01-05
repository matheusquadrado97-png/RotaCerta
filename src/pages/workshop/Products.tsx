import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Plus,
    Search,
    FileUp,
    Download,
    Trash2,
    Pencil,
    CheckCircle2,
    PlusCircle,
    MinusCircle,
    Package,
    Boxes,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";

interface Product {
    id: string;
    workshop_id: string;
    name: string;
    description: string | null;
    price: number;
    stock_quantity: number;
    category: string | null;
    sku: string | null;
}

export default function WorkshopProducts() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [category, setCategory] = useState("");
    const [sku, setSku] = useState("");

    const fetchProducts = async () => {
        if (!user) return;
        setLoading(true);

        const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (!workshop) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('products' as any)
            .select('*')
            .eq('workshop_id', workshop.id)
            .order('name');

        if (error) {
            toast.error("Erro ao carregar produtos");
        } else {
            setProducts((data as any) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, [user]);

    const handleSaveProduct = async () => {
        if (!name || !price) {
            toast.error("Nome e preço são obrigatórios");
            return;
        }

        setIsSaving(true);
        try {
            const { data: workshop } = await supabase
                .from('workshops')
                .select('id')
                .eq('owner_id', user?.id)
                .single();

            if (!workshop) throw new Error("Oficina não encontrada");

            const productData = {
                workshop_id: workshop.id,
                name,
                description,
                price: parseFloat(price),
                stock_quantity: parseInt(stock) || 0,
                category,
                sku
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products' as any)
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
                toast.success("Produto atualizado!");
            } else {
                const { error } = await supabase
                    .from('products' as any)
                    .insert(productData);
                if (error) throw error;
                toast.success("Produto cadastrado!");
            }

            setIsDialogOpen(false);
            resetForm();
            fetchProducts();
        } catch (err: any) {
            toast.error("Erro ao salvar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleStockUpdate = async (id: string, delta: number) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        const newStock = Math.max(0, product.stock_quantity + delta);

        // Optimistic UI
        setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: newStock } : p));

        const { error } = await supabase
            .from('products' as any)
            .update({ stock_quantity: newStock })
            .eq('id', id);

        if (error) {
            toast.error("Erro ao atualizar estoque");
            fetchProducts(); // Rollback
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este produto?")) return;

        try {
            const { error } = await supabase
                .from('products' as any)
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success("Produto excluído");
            fetchProducts();
        } catch (err: any) {
            toast.error("Erro ao excluir: " + err.message);
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setName("");
        setDescription("");
        setPrice("");
        setStock("");
        setCategory("");
        setSku("");
    };

    const handleEdit = (p: Product) => {
        setEditingProduct(p);
        setName(p.name);
        setDescription(p.description || "");
        setPrice(p.price.toString());
        setStock(p.stock_quantity.toString());
        setCategory(p.category || "");
        setSku(p.sku || "");
        setIsDialogOpen(true);
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                const { data: workshop } = await supabase
                    .from('workshops')
                    .select('id')
                    .eq('owner_id', user?.id)
                    .single();

                if (!workshop) throw new Error("Oficina não encontrada");

                const formattedProducts = data.map(item => ({
                    workshop_id: workshop.id,
                    name: item.Nome || item.name || item.Produto,
                    description: item.Descricao || item.description || "",
                    price: parseFloat(item.Preco || item.Price || item.Valor || 0),
                    stock_quantity: parseInt(item.Estoque || item.Stock || 0),
                    category: item.Categoria || item.Category || "",
                    sku: item.SKU || item.sku || ""
                })).filter(p => p.name);

                if (formattedProducts.length === 0) {
                    toast.error("Nenhum produto válido encontrado no arquivo");
                    return;
                }

                setIsSaving(true);
                const { error } = await supabase
                    .from('products' as any)
                    .insert(formattedProducts);

                if (error) throw error;
                toast.success(`${formattedProducts.length} produtos importados com sucesso!`);
                fetchProducts();
            } catch (err: any) {
                toast.error("Erro na importação: Verifique as colunas (Nome, Preco, Estoque)");
                console.error(err);
            } finally {
                setIsSaving(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Estoque de Produtos</h1>
                    <p className="text-slate-500 mt-1">Gerencie peças e insumos da sua oficina.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Button variant="outline" className="gap-2">
                            <FileUp className="h-4 w-4" /> Importar Excel
                        </Button>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleImportExcel}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-200">
                        <Plus className="h-4 w-4" /> Novo Produto
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar produtos..."
                                className="pl-10 h-10 w-full bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-slate-500 font-medium">
                                Total: {products.length} itens
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                            <div className="bg-slate-50 p-4 rounded-full mb-4">
                                <Boxes className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Nenhum produto encontrado</h3>
                            <p className="text-slate-500 max-w-xs mt-1">
                                Comece adicionando itens manualmente ou importando uma planilha Excel.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Produto</th>
                                        <th className="px-6 py-4 font-bold">Categoria</th>
                                        <th className="px-6 py-4 font-bold text-center">Estoque</th>
                                        <th className="px-6 py-4 font-bold text-right">Preço</th>
                                        <th className="px-6 py-4 font-bold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProducts.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{p.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{p.sku || "SEM SKU"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none capitalize">
                                                    {p.category || "Geral"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 border border-transparent hover:border-emerald-100" onClick={() => handleStockUpdate(p.id, -1)}>
                                                        <MinusCircle className="h-4 w-4" />
                                                    </Button>
                                                    <span className={`font-black min-w-[30px] ${p.stock_quantity <= 2 ? 'text-red-500' : 'text-slate-700'}`}>
                                                        {p.stock_quantity}
                                                    </span>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 border border-transparent hover:border-emerald-100" onClick={() => handleStockUpdate(p.id, 1)}>
                                                        <PlusCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                R$ {p.price.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                        <DialogDescription>
                            Preencha as informações básicas do item.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-500">Nome do Produto</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Corrente KMC 11v" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category" className="text-xs font-bold uppercase text-slate-500">Categoria</Label>
                                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Pneus..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sku" className="text-xs font-bold uppercase text-slate-500">SKU / Código</Label>
                                <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex: PRD-001" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price" className="text-xs font-bold uppercase text-slate-500">Preço de Venda (R$)</Label>
                                <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="stock" className="text-xs font-bold uppercase text-slate-500">Estoque Atual</Label>
                                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-xs font-bold uppercase text-slate-500">Descrição</Label>
                            <textarea
                                id="description"
                                className="w-full min-h-[80px] p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Opcional..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={isSaving}
                            onClick={handleSaveProduct}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
