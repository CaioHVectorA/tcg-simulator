import { useApi } from "@/hooks/use-api";
import { useArr } from "@/hooks/use-arr-state";
import { generateUUID } from "@/lib/uuid";
import { useRouter } from "next/navigation";
// export type ArrStateActions<T> = {
//     setArrState: React.Dispatch<React.SetStateAction<T[]>>;
//     addItem: (item: T) => void;
//     removeItem: (index: number) => void;
//     editItem: (index: number, data: T) => void;
//     undo: () => void;
// };
import React, { createContext, useContext } from "react";

type KartItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
    type: "package" | "card"
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
};

const KartContext = createContext<KartContextType | undefined>(undefined);

export const KartProvider = ({ children, setData }: {
    children: React.ReactNode;
    setData: React.Dispatch<React.SetStateAction<number[]>>;
}) => {
    const [kart, { setArrState: setKart, undo, addItem: add, editItem: edit, removeItem: rm }] = useArr<KartItem>([]);
    const { post, loading } = useApi()
    const { refresh } = useRouter()
    const addItem = (item: KartItem) => {
        const exists = kart.find((i) => (i.id === item.id && i.type === item.type));
        if (exists) {
            return editItem(item.id, { quantity: exists.quantity + item.quantity });
        }
        add(item);
    };

    const removeItem = (id: number) => {
        setKart((prevKart) => prevKart.filter((item) => item.id !== id));
    };

    const editItem = (id: number, data: Partial<KartItem>) => {
        setKart((prevKart) =>
            prevKart.map((item) =>
                item.id === id ? { ...item, ...data } : item
            )
        );
    };
    const checkout = async (setOpen: (g: boolean) => void) => {
        const key = generateUUID()
        try {
            const res = await post("/store/checkout?key=" + key, {
                items: kart
            });
            const { data, ok } = res.data;
            if (ok) {
                setKart([]);
            }
            setOpen(false)
            const cardsId = kart.filter(item => item.type === 'card').map(item => item.card_id!)
            setData((prev) => [...prev, ...cardsId])
            return { ok, message: "Compra efetuada com êxito!" };
        } catch (error) {
            return { ok: false, message: "Erro ao finalizar compra, tente novamente em alguns segundos" };
        }
    }
    return (
        <KartContext.Provider value={{ kart, setKart, addItem, removeItem, editItem, undo, checkout, loading }}>
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