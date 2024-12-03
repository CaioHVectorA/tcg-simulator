export function LoadingRing({ }: {}) {
  return (
    <div className="w-16 h-16 border-b-2 border-t-2 border-purple-500 rounded-full animate-spin"></div>
  );
}

export function Loader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}
