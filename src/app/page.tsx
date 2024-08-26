import { Button } from "@nextui-org/react";
import NextLink from "next/link";

export default function Home() {

  return (
    <main>
      <h1 className="text-4xl font-bold text-center">Welcome</h1>
      <Button as={NextLink} href="/settings">Settings</Button>


    </main>
  );
}
