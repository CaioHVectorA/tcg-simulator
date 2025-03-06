import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { AxiosResponse } from "axios";
import { useWebSocket } from "@/context/WebSocketContext";

export enum FriendAction {
  Accept = "accept",
  RemoveRequest = "reject",
  RemoveFriend = "remove",
  CancelRequest = "remove-sent",
  SendRequest = "send",
}

export function useFriendActions() {
  const { post, delete: del } = useApi();
  const queryClient = useQueryClient();

  const { sendFriendRequest, sendTradeRequest, acceptFriendRequest } =
    useWebSocket();
  const handleFriendAction = useMutation({
    mutationFn: async ({
      action,
      id,
    }: {
      action: FriendAction;
      id: number;
    }) => {
      console.log({ action, id });
      switch (action) {
        case FriendAction.Accept:
          acceptFriendRequest(id);
          return await post(`/user/accept/${id}`, {});
        case FriendAction.RemoveRequest:
          return await del(`/user/reject/${id}`);
        case FriendAction.RemoveFriend:
          return await del(`/user/remove/${id}`);
        case FriendAction.CancelRequest:
          return await del(`/user/remove-sent/${id}`);
        case FriendAction.SendRequest:
          sendFriendRequest(id);
          return await post(`/user/send/${id}`, {});
        default:
          throw new Error("Ação inválida");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendship-data"] });
    },
  });

  return { handleFriendAction };
}
