import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import "@/app/globals.css";
export const metadata = {
  title: "Easy CloudBook",
  description: "Easy CloudBook",
};

export default async function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
