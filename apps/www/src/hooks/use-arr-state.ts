import { useRef, useState } from "react";

export type ArrStateActions<T> = {
  setArrState: React.Dispatch<React.SetStateAction<T[]>>;
  addItem: (item: T) => void;
  removeItem: (index: number) => void;
  editItem: (index: number, data: T) => void;
  undo: () => void;
};

export function useArr<T>(initialState: T[] | (() => T[])) {
  const [arrState, setArrState] = useState<T[]>(initialState);
  const lastState = useRef<T[] | null>(null);
  console.log("useArr", { arrState });
  const addItem = (item: T) => {
    setArrState((prevState) => {
      lastState.current = prevState;
      // console.log("Adding item:", item);
      return [...prevState, item];
    });
  };

  const removeItem = (index: number) => {
    setArrState((prevState) => {
      lastState.current = prevState;
      const temp = [...prevState];
      // console.log("Removing item at index:", index);
      temp.splice(index, 1);
      return temp;
    });
  };

  const editItem = (index: number, data: T) => {
    setArrState((prevState) => {
      lastState.current = prevState;
      const temp = [...prevState];
      // console.log("Editing item at index:", index, "with data:", data);
      temp[index] = data;
      return temp;
    });
  };

  const undo = () => {
    if (!lastState.current) return;
    // console.log("Undoing last action");
    setArrState(lastState.current as T[]);
  };

  return [
    arrState,
    { setArrState, editItem, addItem, removeItem, undo } as ArrStateActions<T>,
  ] as const;
}
