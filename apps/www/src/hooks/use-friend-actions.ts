import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { AxiosResponse } from "axios";

export enum FriendAction {
  Accept = "accept",
  RemoveRequest = "reject",
  RemoveFriend = "remove",
  CancelRequest = "remove-sent",
}

export function useFriendActions() {
  const { post, delete: del } = useApi();
  const queryClient = useQueryClient();

  const handleFriendAction = useMutation({
    mutationFn: async ({
      action,
      id,
    }: {
      action: FriendAction;
      id: number;
    }) => {
      switch (action) {
        case FriendAction.Accept:
          return await post(`/user/accept/${id}`, {});
        case FriendAction.RemoveRequest:
          return await del(`/user/reject/${id}`);
        case FriendAction.RemoveFriend:
          return await del(`/user/remove/${id}`);
        case FriendAction.CancelRequest:
          return await del(`/user/remove-sent/${id}`);
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
