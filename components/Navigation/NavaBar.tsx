import { Navbar02 } from "@/components/ui/shadcn-io/navbar-02";

const NavaBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar02 />
      <main>{children}</main>
    </>
  );
};

export default NavaBar;
