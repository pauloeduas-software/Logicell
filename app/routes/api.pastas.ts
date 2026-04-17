import { ActionFunctionArgs } from "react-router";
import { PastaService } from "~/services/pasta.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "createFolder": {
      const nome = formData.get("nome") as string;
      return await PastaService.criar(nome);
    }
    case "renameFolder": {
      const id = Number(formData.get("id"));
      const nome = formData.get("nome") as string;
      return await PastaService.atualizar(id, nome);
    }
    case "deleteFolder": {
      const id = Number(formData.get("id"));
      return await PastaService.excluir(id);
    }
    default:
      return { error: "Intenção inválida" };
  }
}
