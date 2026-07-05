import React from "react";

import { Alert } from "../../../components/ui/alert";

export function ErrorView({ message }: { message: string }) {
  return <Alert variant="error" title="Error">{message}</Alert>;
}
