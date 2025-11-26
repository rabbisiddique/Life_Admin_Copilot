const Logo = () => {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden shadow-lg">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Life-Admin
          </span>
          <span className="text-xs font-semibold text-muted-foreground tracking-wide">
            Copilot
          </span>
        </div>
      </div>
    </>
  );
};

export default Logo;
