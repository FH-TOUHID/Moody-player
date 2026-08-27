import React from "react";
import { SquareMenu } from "lucide-react"; // Using a similar icon for the logo

const Header = () => {
  return (
    <header className="flex items-center gap-2 p-6 border-b border-gray-200/50">
      <SquareMenu className="w-5 h-5 text-gray-800" />
      <h1 className="text-lg font-bold text-gray-900 tracking-tight">
        Moody Player
      </h1>
    </header>
  );
};

export default Header;
