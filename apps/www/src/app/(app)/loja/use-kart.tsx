import { useApi } from "@/hooks/use-api";
import { useArr } from "@/hooks/use-arr-state";
import { generateUUID } from "@/lib/uuid";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { createContext, useContext, useState } from "react";

type KartItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
    type: "package" | "card";
    card_id?: number;
};

type KartContextType = {
    kart: KartItem[];
    setKart: React.Dispatch<React.SetStateAction<KartItem[]>>;
    addItem: (item: KartItem) => void;
    removeItem: (id: number) => void;
    editItem: (id: number, data: Partial<KartItem>) => void;
    undo: () => void;
    checkout: (setOpen: (b: boolean) => void) => Promise<{
        ok: boolean;
        message: string;
    }>;
    loading: boolean;
    lastAddedId: number | null;
    successModalOpen: boolean;
    setSuccessModalOpen: (open: boolean) => void;
    lastPurchasedCount: number;
};

const KartContext = createContext<KartContextType | undefined>(undefined);

export const KartProvider = ({ children, setData }: {
    children: React.ReactNode;
    setData: React.Dispatch<React.SetStateAction<number[]>>;
}) => {
    const [kart, { setArrState: setKart, undo, addItem: add, editItem: edit, removeItem: rm }] = useArr<KartItem>([]);
    const { post, loading } = useApi();
    const qClient = useQueryClient();
    const { refresh } = useRouter();
    const { toast } = useToast();
    const [lastAddedId, setLastAddedId] = useState<number | null>(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [lastPurchasedCount, setLastPurchasedCount] = useState(1);

    const addItem = (item: KartItem) => {
        setLastAddedId(item.id);
        setTimeout(() => setLastAddedId(null), 800);

        const exists = kart.find((i) => (i.id === item.id && i.type === item.type));
        if (exists) {
            editItem(item.id, { quantity: exists.quantity + item.quantity });
            toast({
                title: "Carrinho Atualizado 🛒",
                description: `Ajustado para ${exists.quantity + item.quantity}x ${item.name}.`
            });
            return;
        }
        add(item);
        toast({
            title: "Adicionado ao Carrinho 🛒",
            description: `${item.quantity}x ${item.name} adicionado.`
        });
    };

    const removeItem = (id: number) => {
        const item = kart.find(i => i.id === id);
        setKart((prevKart) => prevKart.filter((item) => item.id !== id));
        if (item) {
            toast({
                title: "Item Removido 🗑️",
                description: `"${item.name}" removido.`
            });
        }
    };

    const editItem = (id: number, data: Partial<KartItem>) => {
        if (data.quantity !== undefined && data.quantity <= 0) {
            removeItem(id);
            return;
        }
        setKart((prevKart) =>
            prevKart.map((item) =>
                item.id === id ? { ...item, ...data } : item
            )
        );
    };

    const checkout = async (setOpen: (g: boolean) => void) => {
        const key = generateUUID();
        try {
            const res = await post("/store/checkout?key=" + key, {
                items: kart
            });
            const { data, ok } = res.data;
            if (ok) {
                await qClient.invalidateQueries({ queryKey: ["user"] });
                await qClient.refetchQueries({ queryKey: ["user"] });
                const itemCount = kart.reduce((acc, item) => acc + item.quantity, 0);
                setLastPurchasedCount(itemCount || 1);
                setKart([]);
                setSuccessModalOpen(true);
            } else {
                toast({
                    variant: "destructive",
                    title: "Não foi possível concluir",
                    description: res.data?.message || "Verifique seu saldo de moedas."
                });
            }
            setOpen(false);
            const cardsId = kart.filter(item => item.type === 'card').map(item => item.card_id!);
            setData((prev) => [...prev, ...cardsId]);
            return { ok, message: "Compra efetuada com êxito!" };
        } catch (error) {
            console.log(error);
            toast({
                variant: "destructive",
                title: "Erro ao finalizar compra",
                description: "Tente novamente em alguns segundos."
            });
            return { ok: false, message: "Erro ao finalizar compra, tente novamente em alguns segundos" };
        }
    };

    return (
        <KartContext.Provider value={{ 
            kart, 
            setKart, 
            addItem, 
            removeItem, 
            editItem, 
            undo, 
            checkout, 
            loading, 
            lastAddedId,
            successModalOpen,
            setSuccessModalOpen,
            lastPurchasedCount
        }}>
            {children}
        </KartContext.Provider>
    );
};

export const useKart = () => {
    const context = useContext(KartContext);
    if (!context) {
        throw new Error("useKart must be used within a KartProvider");
    }
    return context;
};