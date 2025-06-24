"use client";

import { ResourceData, ResourcePhase } from "@/lib/contexts/tender-workflow-context";

/**
 * Helper de validação para a fase recursal
 * Fornece funções úteis para validar diferentes aspectos do fluxo de recursos
 */
export const ResourcePhaseValidations = {
  /**
   * Verifica se há recursos pendentes para serem julgados
   * @param resources Lista de recursos a verificar
   * @returns true se há recursos pendentes, false caso contrário
   */
  hasPendingResources: (resources: ResourceData[]): boolean => {
    return resources.some((resource) => resource.phase !== "judged");
  },

  /**
   * Verifica se há algum recurso procedente
   * @param resources Lista de recursos a verificar
   * @returns true se há pelo menos um recurso procedente, false caso contrário
   */
  hasSuccessfulResources: (resources: ResourceData[]): boolean => {
    return resources.some(
      (resource) => resource.judgment?.decision === "procedente" && resource.phase === "judged"
    );
  },

  /**
   * Verifica se todos os recursos já foram julgados
   * @param resources Lista de recursos a verificar
   * @returns true se todos recursos foram julgados, false se há algum pendente
   */
  allResourcesJudged: (resources: ResourceData[]): boolean => {
    if (resources.length === 0) return true;
    return resources.every((resource) => resource.phase === "judged");
  },

  /**
   * Verifica se a fase atual permite adjudicação pelo pregoeiro
   * @param currentPhase Fase atual do fluxo recursal
   * @param resources Lista de recursos a verificar
   * @returns true se pode adjudicar, false caso contrário
   */
  canAuctioneerAdjudicate: (currentPhase: ResourcePhase, resources: ResourceData[]): boolean => {
    // O pregoeiro só pode adjudicar se:
    // 1. Todos os recursos foram julgados
    // 2. Não há recursos procedentes
    // 3. A fase atual é a de julgamento
    return (
      currentPhase === "judgment" &&
      ResourcePhaseValidations.allResourcesJudged(resources) &&
      !ResourcePhaseValidations.hasSuccessfulResources(resources)
    );
  },

  /**
   * Verifica se a fase atual permite homologação pela autoridade superior
   * @param currentPhase Fase atual do fluxo recursal
   * @param resources Lista de recursos
   * @returns true se pode homologar, false caso contrário
   */
  canAuthorityHomologate: (currentPhase: ResourcePhase): boolean => {
    // A autoridade superior só pode homologar após adjudicação
    return currentPhase === "adjudicated";
  },

  /**
   * Verifica se a fase atual permite revogação pela autoridade superior
   * @param currentPhase Fase atual do fluxo recursal
   * @returns true se pode revogar, false caso contrário
   */
  canAuthorityRevoke: (currentPhase: ResourcePhase): boolean => {
    // A autoridade pode revogar em qualquer momento a partir do julgamento
    return currentPhase === "judgment" || currentPhase === "adjudicated";
  },

  /**
   * Verifica se há manifestações de interesse pendentes para serem convertidas em recursos
   * @param resources Lista de recursos
   * @returns true se há pendências, false caso contrário
   */
  hasPendingManifestations: (resources: ResourceData[]): boolean => {
    return resources.some((resource) => resource.phase === "manifested");
  },
};

export default ResourcePhaseValidations;
