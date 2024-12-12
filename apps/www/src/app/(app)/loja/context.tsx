import { useArr } from "@/hooks/use-arr-state";
// export type ArrStateActions<T> = {
//     setArrState: React.Dispatch<React.SetStateAction<T[]>>;
//     addItem: (item: T) => void;
//     removeItem: (index: number) => void;
//     editItem: (index: number, data: T) => void;
//     undo: () => void;
// };
import React, { createContext, useContext } from "react";

type KartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

type KartContextType = {
    kart: KartItem[];
    setKart: React.Dispatch<React.SetStateAction<KartItem[]>>;
    addItem: (item: KartItem) => void;
    removeItem: (id: string) => void;
    editItem: (id: string, data: Partial<KartItem>) => void;
    undo: () => void;
};

const KartContext = createContext<KartContextType | undefined>(undefined);

export const KartProvider = ({ children }: {
    children: React.ReactNode;
}) => {
    const [kart, { setArrState: setKart, undo }] = useArr<KartItem>([]);

    const addItem = (item: KartItem) => {
        setKart((prevKart) => [...prevKart, item]);
    };

    const removeItem = (id: string) => {
        setKart((prevKart) => prevKart.filter((item) => item.id !== id));
    };

    const editItem = (id: string, data: Partial<KartItem>) => {
        setKart((prevKart) =>
            prevKart.map((item) =>
                item.id === id ? { ...item, ...data } : item
            )
        );
    };

    return (
        <KartContext.Provider value={{ kart, setKart, addItem, removeItem, editItem, undo }}>
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