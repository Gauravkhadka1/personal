import React from "react";

type Props = {
  name: string;
  buttonComponent?: any;
  isSmallText?: boolean;
};

const Header = ({ name, buttonComponent, isSmallText = false }: Props) => {
  return (
    <div className="flex w-full items-center justify-between py-3">
      <h1 className={`${isSmallText ? "text-lg" : "text-xl"} font-semibold dark:text-gray-200`} >
        {name}
      </h1>
      {buttonComponent}
    </div>
  );
};

export default Header;