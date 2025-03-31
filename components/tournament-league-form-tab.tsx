import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "./ui/button";
import { TournamentCharacteristics } from "@/app/types/tournament";
import { Card } from "./ui/card";
import { useEffect } from "react";

export default function TournamentLeagueFormTab({
  isPending,
  characteristicsResponse,
  form,
  prevStep,
}: {
  isPending: boolean;
  characteristicsResponse: TournamentCharacteristics;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  prevStep: () => void;
}) {
  // Variável que controla os critérios de desempate com suas prioridades
  const tieBreakerRuleTypes = form.watch("tieBreakerRuleTypes");

  // Quando o componente é montado, inicializa os valores no form com os critérios vindos do pai
  useEffect(() => {
    if (!tieBreakerRuleTypes?.length) {
      // Inicializa o form com a lista de critérios de desempate e prioridade 0
      const initialRules = characteristicsResponse.tieBreakerRuleTypes.map(
        (rule, index) => ({
          id: rule.id,
          priority: index + 1, // A prioridade inicial pode ser 0 ou qualquer valor padrão
        })
      );
      form.setValue("tieBreakerRuleTypes", initialRules);
    }
  }, [form, characteristicsResponse.tieBreakerRuleTypes, tieBreakerRuleTypes]);

  // Função chamada quando o usuário termina o drag-and-drop (ou seja, quando o critério é reorganizado)
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Reordena os itens com base na posição após o drag-and-drop
    const reorderedItems = [...tieBreakerRuleTypes];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    // Atualiza as prioridades com base na nova ordem
    const updatedRules = reorderedItems.map((item, index) => ({
      ...item,
      priority: index + 1, // A prioridade começa de 1
    }));

    // Atualiza o form com as novas prioridades
    form.setValue("tieBreakerRuleTypes", updatedRules);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Defina a Prioridade</h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tieBreakerRules">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {tieBreakerRuleTypes?.map(
                (rule: { id: string; priority: number }, index: number) => {
                  // Encontrar o nome do critério baseado no id
                  const ruleData =
                    characteristicsResponse.tieBreakerRuleTypes.find(
                      (item) => item.id === rule.id
                    );
                  return (
                    ruleData && (
                      <Draggable
                        key={rule.id}
                        draggableId={rule.id}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="p-3 flex items-center justify-between cursor-pointer bg-gray-100"
                          >
                            <span className="font-medium">
                              {index + 1}. {ruleData.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              Arraste para reordenar
                            </span>
                          </Card>
                        )}
                      </Draggable>
                    )
                  );
                }
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep}>
          Voltar
        </Button>
        <div className="flex justify-end space-x-2">
          <Button type="submit" className="cursor-pointer" disabled={isPending}>
            {isPending ? "Criando..." : "Criar Torneio"}
          </Button>
        </div>
      </div>
    </div>
  );
}
