import ModalWrapper from "@/components/ModalWrapper";
import AddAccountForm from "./forms/AddAccountForm";
import EditAccountForm from "./forms/EditAccountForm";

export default function AddModal({
  isOpen,
  onClose,
  onSave,
  account = null,
  existingAccounts = [],
  initialSubAccountData = null,
}) {
  const isEdit = !!account;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Account" : "Add New Account"}
      description={isEdit ? "Update existing account info" : "Fill out new account info"}
      maxWidth="max-w-4xl"
    >
      {isEdit ? (
        <EditAccountForm
          initialData={account}
          existingAccounts={existingAccounts}
          onSave={onSave}
          onCancel={onClose}
        />
      ) : (
        <AddAccountForm
          existingAccounts={existingAccounts}
          initialSubAccountData={initialSubAccountData}
          onSave={onSave}
          onCancel={onClose}
        />
      )}
    </ModalWrapper>
  );
}
