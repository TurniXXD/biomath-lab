import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { axiosInstance, publicHttp } from "@/lib/api/client";

export type UserCreate = {
  email: string;
};

export type UserOut = {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
};

export type DNASequenceCreate = {
  email: string;
  name?: string | null;
  sequence: string;
  source?: string | null;
};

export type DNASequenceOut = {
  id: number;
  name?: string | null;
  sequence: string;
  source?: string | null;
  created_at: string;
  updated_at: string;
};

export type DNASequenceLatestOut = {
  sequence: DNASequenceOut | null;
};

export type AlphaFoldLookupRequest = {
  accession: string;
};

export type AlphaFoldPrediction = {
  accession: string;
  entry_id?: string | null;
  protein_name?: string | null;
  gene_name?: string | null;
  organism_name?: string | null;
  sequence_length?: number | null;
  average_plddt?: number | null;
  confidence_label?: string | null;
  reviewed?: boolean | null;
  uniprot_url?: string | null;
  entry_url?: string | null;
  pdb_url?: string | null;
  cif_url?: string | null;
  bcif_url?: string | null;
  pae_url?: string | null;
  pae_image_url?: string | null;
  sequence?: string | null;
};

export type AlphaFoldLookupResponse = {
  accession: string;
  count: number;
  predictions: AlphaFoldPrediction[];
};

export type Evo2GenerateRequest = {
  sequence: string;
  num_tokens?: number;
  temperature?: number;
  top_k?: number;
  enable_sampled_probs?: boolean;
  enable_elapsed_ms_per_token?: boolean;
};

export type Evo2GenerateResponse = {
  input_sequence: string;
  generated_sequence: string;
  full_sequence: string;
  sampled_probs: number[];
  elapsed_ms?: number | null;
  elapsed_ms_per_token: number[];
};

export type ObjectiveMode = "balanced" | "atp" | "nadph";
export type MetabolismProvider = "kegg" | "biocyc" | "ecocyc" | "reactome";

export type MetabolismSimulationRequest = {
  glucose?: number;
  oxygen?: number;
  adp?: number;
  nad?: number;
  nadp?: number;
  fad?: number;
  objective_mode?: ObjectiveMode;
};

export type MetabolismSimulationResponse = {
  objective_mode: ObjectiveMode;
  pathway_fluxes: {
    glycolysis: number;
    pentose_phosphate_pathway: number;
    pyruvate_oxidation: number;
    krebs_cycle: number;
    electron_transport_chain: number;
  };
  outputs: {
    atp: number;
    nadh: number;
    nadph: number;
    fadh2: number;
    co2: number;
    ribose5p: number;
  };
  flux_analysis: {
    glucose_partition: Record<string, number>;
    reaction_fluxes: Array<{
      reaction_id: string;
      label: string;
      flux: number;
      normalized_flux: number;
    }>;
    yield_metrics: {
      atp_per_glucose: number;
      nadph_per_glucose: number;
      nadh_per_glucose: number;
      oxygen_utilization: number;
    };
    dominant_pathway: string;
  };
  flux_balance_analysis: {
    objective_reaction: string;
    objective_sense: string;
    constrained_uptakes: Record<string, number>;
    shadow_prices: Array<{
      metabolite_id: string;
      label: string;
      value: number;
    }>;
    reduced_costs: Array<{
      reaction_id: string;
      label: string;
      value: number;
    }>;
  };
  status: string;
  solver_status: string;
  objective_value: number;
  message: string;
};

export type MetabolismProviderSearchResponse = {
  provider: MetabolismProvider;
  query: string;
  items: Array<{
    id: string;
    name: string;
    source: MetabolismProvider;
    summary?: string | null;
    url?: string | null;
  }>;
};

export type PublicationsNewsSource = "pubmed" | "europepmc";

export type PublicationsNewsLatestRequest = {
  query?: string;
  day_offset?: number;
  max_results_per_source?: number;
  sources?: PublicationsNewsSource[];
};

export type PublicationsNewsItem = {
  pmid: string;
  title: string;
  authors: string[];
  journal?: string | null;
  pubdate?: string | null;
  doi?: string | null;
  url: string;
  source: PublicationsNewsSource;
};

export type PublicationsNewsLatestResponse = {
  query: string;
  day_offset: number;
  date_label: string;
  total_count: number;
  groups: Record<PublicationsNewsSource, PublicationsNewsItem[]>;
};

export type ReactomeSearchResponse = {
  query: string;
  items: Array<{
    db_id?: number | null;
    st_id?: string | null;
    name: string;
    species?: string | null;
    schema_class?: string | null;
    url?: string | null;
  }>;
};

export type ReactomeAnalyzeGoalRequest = {
  organism?: string;
  target_metabolite: string;
  goal: string;
  model_type?: string;
};

export type ReactomeAnalyzeGoalResponse = {
  organism: string;
  target_metabolite: string;
  goal: string;
  model_type: string;
  narrative: string;
  pathway_hits: Array<{
    db_id?: number | null;
    st_id?: string | null;
    name: string;
    species?: string | null;
    schema_class?: string | null;
    url?: string | null;
  }>;
  top_pathway?: {
    db_id?: number | null;
    st_id?: string | null;
    display_name: string;
    schema_class?: string | null;
    species?: string | null;
    summary?: string | null;
    literature_count: number;
    contained_events: Array<{
      db_id?: number | null;
      st_id?: string | null;
      name: string;
      schema_class?: string | null;
    }>;
    participants: Array<{
      db_id?: number | null;
      st_id?: string | null;
      name: string;
      schema_class?: string | null;
    }>;
  } | null;
  reactions: Array<{
    db_id?: number | null;
    st_id?: string | null;
    display_name: string;
    schema_class?: string | null;
    species?: string | null;
    summary?: string | null;
    inputs: Array<{
      db_id?: number | null;
      st_id?: string | null;
      name: string;
      schema_class?: string | null;
    }>;
    outputs: Array<{
      db_id?: number | null;
      st_id?: string | null;
      name: string;
      schema_class?: string | null;
    }>;
    catalysts: Array<{
      db_id?: number | null;
      st_id?: string | null;
      name: string;
      schema_class?: string | null;
    }>;
  }>;
};

type QueryResult<TData> = UseQueryResult<TData, Error>;
type MutationResult<TData, TVariables> = UseMutationResult<TData, Error, TVariables>;

const toQueryString = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        searchParams.append(key, String(item));
      });
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const postJson = <TData>(url: string, body: unknown) => {
  return axiosInstance<TData>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

const postPublicJson = <TData>(url: string, body: unknown) => {
  return publicHttp.request<TData>({
    url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify(body),
  }).then((response) => response.data);
};

export const upsertUserByEmail = (payload: UserCreate) => {
  return postPublicJson<UserOut>("/users/oauth", payload);
};

export const useUpsertUserByEmailMutation = (): MutationResult<
  UserOut,
  UserCreate
> => {
  return useMutation({
    mutationFn: (payload) => upsertUserByEmail(payload),
  });
};

export const getLatestDNASequence = (email: string) => {
  return axiosInstance<DNASequenceLatestOut>(
    `/dna-sequences/latest${toQueryString({ email })}`,
    {
      method: "GET",
    },
  );
};

export const useLatestDNASequenceQuery = (
  email: string | null,
  enabled = true,
): QueryResult<DNASequenceLatestOut> => {
  return useQuery({
    queryKey: ["dna-sequences", "latest", email],
    queryFn: () => {
      if (!email) {
        throw new Error("Missing email");
      }

      return getLatestDNASequence(email);
    },
    enabled: enabled && Boolean(email),
  });
};

export const saveDNASequence = (payload: DNASequenceCreate) => {
  return postJson<DNASequenceOut>("/dna-sequences", payload);
};

export const useSaveDNASequenceMutation = (): MutationResult<
  DNASequenceOut,
  DNASequenceCreate
> => {
  return useMutation({
    mutationFn: (payload) => saveDNASequence(payload),
  });
};

export const getAlphaFoldLookup = (accession: string) => {
  return axiosInstance<AlphaFoldLookupResponse>(`/alphafold/${accession}`, {
    method: "GET",
  });
};

export const useAlphaFoldLookupQuery = (
  accession: string,
  enabled = true,
): QueryResult<AlphaFoldLookupResponse> => {
  return useQuery({
    queryKey: ["alphafold", accession],
    queryFn: () => getAlphaFoldLookup(accession),
    enabled: enabled && Boolean(accession),
  });
};

export const getAlphaFoldPdb = (accession: string) => {
  return axiosInstance<string>(`/alphafold/${accession}/pdb`, {
    method: "GET",
  });
};

export const useAlphaFoldPdbQuery = (
  accession: string,
  enabled = true,
): QueryResult<string> => {
  return useQuery({
    queryKey: ["alphafold", accession, "pdb"],
    queryFn: () => getAlphaFoldPdb(accession),
    enabled: enabled && Boolean(accession),
  });
};

export const getEvo2Generate = (payload: Evo2GenerateRequest) => {
  return postJson<Evo2GenerateResponse>("/evo2/generate", payload);
};

export const useEvo2GenerateQuery = (
  payload: Evo2GenerateRequest | null,
  enabled = true,
): QueryResult<Evo2GenerateResponse> => {
  return useQuery({
    queryKey: ["evo2", "generate", payload],
    queryFn: () => {
      if (!payload) {
        throw new Error("Missing Evo 2 request");
      }

      return getEvo2Generate(payload);
    },
    enabled: enabled && Boolean(payload),
  });
};

export const getMetabolismSimulation = (payload: MetabolismSimulationRequest) => {
  return postJson<MetabolismSimulationResponse>("/metabolism/simulate", payload);
};

export const useMetabolismSimulationQuery = (
  payload: MetabolismSimulationRequest | null,
  enabled = true,
): QueryResult<MetabolismSimulationResponse> => {
  return useQuery({
    queryKey: ["metabolism", "simulate", payload],
    queryFn: () => {
      if (!payload) {
        throw new Error("Missing metabolism request");
      }

      return getMetabolismSimulation(payload);
    },
    enabled: enabled && Boolean(payload),
  });
};

export const searchMetabolismProvider = (
  provider: MetabolismProvider,
  query: string,
) => {
  return axiosInstance<MetabolismProviderSearchResponse>(
    `/metabolism/providers/${provider}/search${toQueryString({ query })}`,
    {
      method: "GET",
    },
  );
};

export const useMetabolismProviderSearchQuery = (
  provider: MetabolismProvider,
  query: string,
  enabled = true,
): QueryResult<MetabolismProviderSearchResponse> => {
  return useQuery({
    queryKey: ["metabolism", provider, "search", query],
    queryFn: () => searchMetabolismProvider(provider, query),
    enabled: enabled && Boolean(query),
  });
};

export const getPublicationsNewsLatest = (payload: PublicationsNewsLatestRequest) => {
  return postJson<PublicationsNewsLatestResponse>("/publications-news/latest", payload);
};

export const usePublicationsNewsLatestQuery = (
  payload: PublicationsNewsLatestRequest | null,
  enabled = true,
): QueryResult<PublicationsNewsLatestResponse> => {
  return useQuery({
    queryKey: ["publications-news", "latest", payload],
    queryFn: () => {
      if (!payload) {
        throw new Error("Missing publications query");
      }

      return getPublicationsNewsLatest(payload);
    },
    enabled: enabled && Boolean(payload),
  });
};

export const getReactomeAnalyzeGoal = (payload: ReactomeAnalyzeGoalRequest) => {
  return postJson<ReactomeAnalyzeGoalResponse>("/reactome/analyze-goal", payload);
};

export const useReactomeAnalyzeGoalQuery = (
  payload: ReactomeAnalyzeGoalRequest | null,
  enabled = true,
): QueryResult<ReactomeAnalyzeGoalResponse> => {
  return useQuery({
    queryKey: ["reactome", "analyze-goal", payload],
    queryFn: () => {
      if (!payload) {
        throw new Error("Missing Reactome request");
      }

      return getReactomeAnalyzeGoal(payload);
    },
    enabled: enabled && Boolean(payload),
  });
};
