export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  summary: string;
  fullContent: {
    problem: string;
    architecture: string[];
    tradeoffs: string[];
  };
  impact: { label: string; value: string }[];
  technologies: string[];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'enterprise-rag',
    title: 'Enterprise RAG System',
    subtitle: 'Dynamic Knowledge Retrieval for Trust & Safety',
    category: 'RAG & Knowledge Systems',
    summary: 'Replacing static fine-tuning with a verifiable, source-cited retrieval engine for 1,000+ operations analysts',
    fullContent: {
      problem: `Trust & Safety operations at a Fortune 50 platform struggled with fragmented policy documentation. Analysts spent hours cross-referencing wikis and databases to make enforcement decisions. The initial proposal—fine-tuning an LLM—was rejected because it produced "black box" answers without citations. In a compliance environment, provenance is mandatory; every answer must link to a specific, active policy clause for audit purposes. Additionally, weekly policy updates made fine-tuning cycles (quarterly at best) too slow to be safe.`,
      architecture: [
        `**Parent-Child Indexing**: Standard chunking breaks logical context. I implemented a Parent-Child Schema using Unstructured.io for document parsing: we index granular 512-token chunks for dense vector matching, but retrieve the full "parent" document window (2048 tokens) for LLM context. This preserves the document structure compliance documentation requires.`,
        `**Hybrid Search with LanceDB**: Compliance queries are bimodal: exact identifiers ("Policy CP-2847") and conceptual questions. LanceDB handles both modes: Full-Text Search for typo-tolerant keyword matching, Dense Vector Search with BGE-M3 embeddings (multilingual, 8192-token context), and Cross-Encoder Reranking for final relevance scoring.`,
        `**Semantic Routing**: The incoming query is embedded and compared against pre-defined intent clusters. Routine lookups (~70%) route to Gemini 2.0 Flash (sub-second, minimal cost). Complex synthesis (~30%) routes to Gemini 1.5 Pro-002. The router adds ~20ms latency but reduced inference costs by ~60%.`
      ],
      tradeoffs: [
        `**RAG vs. Fine-tuning**: Fine-tuning locks knowledge to a training snapshot. For a domain where policies change weekly, this staleness creates legal risk. RAG allows index updates in minutes with source citations for every answer.`,
        `**LanceDB vs. Separate Indices**: Earlier iterations ran separate BM25 and vector stores. The operational overhead wasn't worth it. LanceDB's hybrid search simplified the architecture.`,
        `**BGE-M3 vs. OpenAI Embeddings**: BGE-M3 is open-source, supports 8192-token contexts (critical for long policy documents), and performs competitively. Running it locally avoided API rate limits.`
      ]
    },
    impact: [
      { label: 'Time-to-answer reduction', value: '85%' },
      { label: 'Knowledge update latency', value: 'Real-time' },
      { label: 'Deployment timeline', value: '<1 Quarter' }
    ],
    technologies: ['Python', 'LanceDB', 'BGE-M3', 'Semantic Router', 'Unstructured.io', 'Gemini']
  },
  {
    slug: 'compliance-automation',
    title: 'Compliance Automation',
    subtitle: 'Audit-Proof Policy Enforcement',
    category: 'ML Classification & MLOps',
    summary: 'Explainable GBDT classifiers enabling legally defensible automation across millions of daily user accounts',
    fullContent: {
      problem: `Manual policy enforcement was unscalable—consuming 68,000+ analyst hours monthly and couldn't keep pace with platform growth. But the blocker to automation wasn't model accuracy; it was legal defensibility. When a user appeals an automated penalty, the legal team needs to explain the decision in plain English. A neural network outputting "0.97 probability of violation" without a reason code is legally insufficient. Secondary constraint: false positives carry asymmetric risk. Incorrectly penalizing a legitimate user creates legal exposure and trust damage.`,
      architecture: [
        `**Why XGBoost Over Deep Learning**: Neural networks offer higher theoretical capacity, but GBDT was the right choice: native decision-path transparency (explicit feature splits), superior performance on tabular data at our training set size, and orders of magnitude cheaper inference at scale.`,
        `**Calibrated Probability Outputs**: Raw model scores aren't true probabilities. I applied Isotonic Calibration to map outputs to empirical probabilities. Post-calibration, a 0.95 score means "historically, 95% of cases with this score were confirmed violations." This enables dynamic threshold management via GrowthBook.`,
        `**SHAP-Based Explanation Generation**: Every positive prediction generates a SHAP breakdown with specific feature contributions, converting mathematical decisions into audit-ready documentation.`,
        `**Feature Serving with Redis**: Features like "posts_last_24h" need to be fresh at inference time. Redis serves as a lightweight online feature store with <5ms latency, ensuring training-serving consistency.`
      ],
      tradeoffs: [
        `**Precision vs. Recall**: We optimized strictly for precision at the expense of recall. Missing some violations is acceptable (human reviewers catch them); incorrectly penalizing legitimate users is not.`,
        `**Redis vs. Heavy Feature Store**: Feast and similar feature stores add operational complexity. For tens of features (not thousands), Redis + Parquet was sufficient and simpler.`,
        `**GrowthBook vs. Custom Flagging**: GrowthBook provides audit logs, gradual rollouts, and threshold management out of the box.`
      ]
    },
    impact: [
      { label: 'Automation rate', value: '65%+' },
      { label: 'Annual savings', value: 'Multi-million $' },
      { label: 'Production rollbacks', value: 'Zero' }
    ],
    technologies: ['Python', 'XGBoost', 'SHAP', 'Redis', 'GrowthBook', 'Airflow']
  },
  {
    slug: 'superwhisperer',
    title: 'SuperWhisperer',
    subtitle: 'Privacy-First Meeting Intelligence',
    category: 'Real-Time AI & Speech Intelligence',
    summary: 'Hybrid edge-cloud architecture delivering sub-3s contextual cues without sending raw audio to the cloud',
    fullContent: {
      problem: `Enterprises block cloud-based meeting assistants (Otter, Fireflies, etc.) due to data leakage risks. IT security reviews routinely reject tools that send raw audio to external servers. Users want real-time contextual cues during meetings ("What did we decide about X?"), but security prohibits sending raw audio to OpenAI or Google. The challenge: deliver cloud-grade intelligence while keeping raw audio strictly on-device.`,
      architecture: [
        `**Local Processing Layer**: All audio handling stays on the user's machine. Audio Capture & VAD segments the microphone stream. ASR via faster-whisper (distilled Whisper model) runs locally—on Apple Silicon, this delivers ~1-2 second transcription latency for a 3-second chunk.`,
        `**PII Redaction**: Before any text leaves the device, Microsoft Presidio catches standard PII patterns (credit cards, SSNs, phone numbers). GLiNER (Generalist Model for NER) handles zero-shot entity extraction for non-standard sensitive terms like project codenames.`,
        `**Cloud Reasoning Layer**: Anonymized transcript is sent to Gemini 2.0 Flash via FastAPI WebSockets. The LLM never sees raw audio, never sees PII—only scrubbed text.`,
        `**Speculative Retrieval**: The system predicts likely intent during speech pauses (VAD gaps) and pre-fetches relevant context. When the user finishes speaking, the RAG payload is often already prepared.`
      ],
      tradeoffs: [
        `**Local ASR vs. Cloud ASR**: Local ASR is slower than Deepgram or AssemblyAI streaming (~1.5s vs ~300ms). We accepted this latency to guarantee zero raw audio egress—making the tool compliant with strict IT policies.`,
        `**GLiNER vs. Standard NER**: spaCy's standard NER misses context-dependent sensitive information. GLiNER is heavier but significantly more robust at identifying sensitive codenames without training data.`,
        `**Gemini 2.0 Flash vs. Local LLM**: Local LLM would keep everything on-device but the quality gap is still significant for nuanced reasoning.`
      ]
    },
    impact: [
      { label: 'Time-to-First-Token', value: '<2s' },
      { label: 'Per hour cost', value: '<$0.20' },
      { label: 'Local audio processing', value: '100%' }
    ],
    technologies: ['Python', 'faster-whisper', 'Presidio', 'GLiNER', 'FastAPI', 'Gemini']
  },
  {
    slug: 'multi-agent-discovery',
    title: 'Multi-Agent Partner Discovery',
    subtitle: 'Intent-Guided B2B Discovery Engine',
    category: 'Multi-Agent AI Systems',
    summary: 'Structured multi-agent pipeline using tool use and verification to map vague business needs to verified partners',
    fullContent: {
      problem: `A partner directory with 50,000+ entities suffered from the "keyword gap." Users searched for business problems ("fix my iOS attribution") while partners listed technical capabilities ("SKAdNetwork implementation certified"). Standard vector search failed because the user's intent didn't semantically match the partner's capability description. Single-shot LLM queries hallucinated recommendations without verifying partners actually had the claimed capabilities. The directory data was self-reported and often stale.`,
      architecture: [
        `**The Graph Flow**: User Query → Navigator → Strategist → Verifier → Response. Built as a Structured State Machine using LangGraph where agents have explicit roles, typed outputs, and tool access.`,
        `**Navigator (Schema Extraction)**: Extracts a structured Pydantic schema with problem_category, specific_issue, budget_range, region, current_stack, hard_requirements, and soft_preferences. Uses Pydantic schema enforcement—cannot proceed until valid structured output.`,
        `**Strategist (Taxonomy Mapping)**: Maps the user's problem schema to the internal solution taxonomy. "iOS attribution issues" maps to "Mobile Measurement Partner" category with "SKAdNetwork" as a required capability filter.`,
        `**Verifier (Tool Use)**: Queries Qdrant with filters, then verifies claims via index-based verification or on-demand verification using Tavily Search API (~500ms per query).`
      ],
      tradeoffs: [
        `**Why LangGraph Over ReAct Loops**: Standard ReAct loops are unpredictable. LangGraph defines a Finite State Machine with deterministic states. When something breaks, the state machine makes it obvious which agent failed.`,
        `**Structured Outputs vs. Flexibility**: Forcing Pydantic schema output constrains what the Navigator can express. Edge cases route to a human specialist.`,
        `**Qdrant vs. Pinecone**: Qdrant offers robust payload filtering alongside semantic queries. For this use case, filter quality mattered more than managed convenience.`
      ]
    },
    impact: [
      { label: 'Searchable entities', value: '50,000+' },
      { label: 'Capability matching', value: 'Verified' },
      { label: 'Conversion depth vs keyword', value: '3x' }
    ],
    technologies: ['Python', 'LangGraph', 'Pydantic', 'Tavily', 'Qdrant']
  },
  {
    slug: 'compliantphotos',
    title: 'CompliantPhotos SaaS',
    subtitle: 'Neuro-Symbolic Passport Validation',
    category: 'Full-Stack AI Product',
    summary: 'Combining deterministic computer vision for strict measurements with LLM reasoning for qualitative feedback',
    fullContent: {
      problem: `Passport photo validation requires both rigid precision (face height 1.29 inches, head 50-69% of frame) and subjective judgment (neutral expression, even lighting). Pure computer vision is brittle—hard-coded rules fail on edge cases. Pure GenAI is unreliable for measurement—LLMs cannot accurately determine that a face is "1.2 inches from chin to crown" from pixels. Neither approach works alone. Additionally, users don't understand why they failed. "Rejected: non-compliant" teaches nothing.`,
      architecture: [
        `**Frontend**: Built with Next.js 15 (App Router), Tailwind CSS, and Shadcn/UI. The UI uses React Query for optimistic updates. Key UX: drag-and-drop upload, real-time progress indicators, results as actionable checklist.`,
        `**Backend API**: FastAPI serves the REST API and handles file uploads. Clean separation: the frontend knows nothing about CV or LLMs.`,
        `**The "Symbolic" Layer**: Google MediaPipe Face Mesh (468 facial landmarks) for geometric extraction. MediaPipe handles angled faces and partial occlusions far better than dlib's 2014-era model. From landmarks: face-to-frame ratio, head centering, eye-to-chin distance.`,
        `**The "Neural" Layer**: Gemini 2.0 Flash analyzes for subjective criteria: expression neutrality, lighting quality, background uniformity. Also synthesizes human-readable feedback with actionable guidance.`,
        `**Workflow Orchestration**: Temporal provides durable execution. Workflows survive process restarts. Users who pay expect results—Temporal ensures worker crashes don't silently drop requests.`
      ],
      tradeoffs: [
        `**MediaPipe vs. dlib**: MediaPipe offers 7x more landmarks, 3x faster inference, better robustness. Migration reduced measurement errors on angled faces by ~40%.`,
        `**Next.js + Python Split**: Next.js provides superior frontend DX. Python provides superior ML ecosystem. Split adds deployment complexity but uses best tools for each layer.`,
        `**Temporal vs. Celery**: Celery requires manual checkpointing for crash recovery. Temporal provides durability automatically—critical for a paid service where dropped requests = refunds.`
      ]
    },
    impact: [
      { label: 'Processing latency', value: '<10s' },
      { label: 'False rejection rate', value: '<1%' },
      { label: 'Workflow durability', value: '100%' }
    ],
    technologies: ['TypeScript', 'Next.js', 'Tailwind', 'Python', 'FastAPI', 'MediaPipe', 'Gemini', 'Temporal', 'Vercel', 'Render', 'PostgreSQL', 'Redis']
  }
];
