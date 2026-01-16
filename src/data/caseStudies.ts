export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  projectType?: string;
  externalLink?: string;
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
    slug: 'compliantphotos',
    title: 'CompliantPhotos SaaS',
    subtitle: 'Neuro-Symbolic Passport Validation',
    category: 'Full-Stack AI Product',
    projectType: 'Personal Project / Production SaaS',
    externalLink: 'https://compliantphotos.com',
    summary: 'Combining deterministic computer vision for strict measurements with LLM reasoning for qualitative feedback',
    fullContent: {
      problem: `Passport photo validation requires both rigid precision (face height 1.29 inches, head 50-69% of frame) and subjective judgment (neutral expression, even lighting). Pure computer vision is brittle—hard-coded rules fail on edge cases. Pure GenAI is unreliable for measurement—LLMs cannot accurately determine that a face is "1.2 inches from chin to crown" from pixels.

Neither approach works alone. Additionally, users don't understand why they failed. "Rejected: non-compliant" teaches nothing. They need actionable guidance.`,
      architecture: [
        `**I built a Neuro-Symbolic Pipeline** wrapped in a modern full-stack application.`,

        `**Frontend (TypeScript):** I built it with Next.js 15 (App Router), Tailwind CSS, and Shadcn/UI for rapid component development. The UI uses React Query for optimistic updates—users see immediate feedback ("Processing...") while heavy computation happens asynchronously. Key UX decisions: drag-and-drop upload with instant preview, real-time progress indicators during processing, and results displayed as actionable checklist (✓ Face centered, ✗ Background too dark).`,

        `**Backend API (Python):** FastAPI serves the REST API and handles file uploads. Clean separation: the frontend knows nothing about CV or LLMs; it just calls /api/validate and renders the response.`,

        `**The "Symbolic" Layer (Deterministic Measurement):** I use Google MediaPipe Face Mesh (468 facial landmarks) for geometric extraction. MediaPipe replaced the legacy dlib approach because it offers 468 landmarks vs 68, ~30ms speed vs ~100ms, excellent head pose robustness vs poor, and Apache 2.0 license vs restrictive. MediaPipe handles angled faces and partial occlusions far better than dlib's 2014-era model. From the 468 landmarks, I calculate face-to-frame ratio, head centering (pixel offset from frame center), and eye-to-chin distance (validates face height requirements). OpenCV handles image preprocessing (color space conversion, cropping, resizing) but not detection.`,

        `**The "Neural" Layer (Qualitative Assessment):** Gemini 2.0 Flash analyzes the image for subjective criteria: expression neutrality (slight smile? tension?), lighting quality (shadows, uneven illumination), and background uniformity (gradients, objects). The LLM also synthesizes all results into human-readable feedback with actionable guidance like "Move 6 inches closer to the camera" or "Add light source from your left."`,

        `**Why Not Just Use the LLM for Everything?** I tested Gemini 2.0 Flash on geometric measurement. Face-to-frame ratio: ~70% LLM accuracy vs >99% MediaPipe. Background color match: ~85% vs >99%. Face centering: ~75% vs >99%. LLMs hallucinate measurements. They'll state "face is 52% of frame" when it's actually 45%. For compliance checking where exact measurements have legal implications, this is unacceptable.`,

        `**Workflow Orchestration (Temporal):** The processing pipeline: upload → validate format → run MediaPipe → run Gemini → store results → notify user. If a worker crashes mid-pipeline, what happens to the user's paid request? Temporal provides durable execution. Workflows survive process restarts—if a worker dies between MediaPipe and Gemini, another worker picks up from the last checkpoint. This isn't about handling a 10-second task; it's about guaranteeing completion. Users who pay expect results. Temporal ensures worker crashes, deployments, or network blips don't silently drop requests.`,

        `**Infrastructure:** Frontend hosting on Vercel (zero-config Next.js deployment), Backend API on Render (simple Python hosting), Workers on Render Background Workers (scales with queue depth), Database on Render PostgreSQL (managed, no ops overhead), Cache/Queue on Redis (session state, Temporal queues), Workflow on Temporal Cloud (managed durable execution). I chose managed services to minimize DevOps overhead on a solo project. The complexity budget went into application reliability, not infrastructure primitives.`
      ],
      tradeoffs: [
        `**MediaPipe vs. dlib:** MediaPipe offers 7x more landmarks, 3x faster inference, and better robustness to head pose. The migration from dlib reduced measurement errors on angled faces by ~40%.`,

        `**Next.js + Python Split:** Next.js provides superior frontend DX (Vercel deployment, React ecosystem). Python provides superior ML ecosystem (MediaPipe, Temporal SDK). The split adds deployment complexity but lets each layer use the best tools.`,

        `**Temporal vs. Celery:** Celery requires manual checkpointing for crash recovery. Temporal provides durability automatically. For a paid service where dropped requests = refunds, the reliability guarantee justified the added complexity.`,

        `**Gemini 2.0 Flash vs. Pro:** Flash is ~10x cheaper and fast enough for this use case. Pro would improve qualitative assessment marginally but blow the per-request cost budget.`
      ]
    },
    impact: [
      { label: 'Processing latency', value: '<10s' },
      { label: 'False rejection rate', value: '<1%' },
      { label: 'Workflow durability', value: '100%' }
    ],
    technologies: ['TypeScript', 'Next.js', 'Tailwind', 'Python', 'FastAPI', 'MediaPipe', 'Gemini', 'Temporal', 'Vercel', 'Render', 'PostgreSQL', 'Redis']
  },
  {
    slug: 'enterprise-rag',
    title: 'Enterprise RAG System',
    subtitle: 'Dynamic Knowledge Retrieval for Trust & Safety',
    category: 'RAG & Knowledge Systems',
    summary: 'Replacing static fine-tuning with a verifiable, source-cited retrieval engine for 1,000+ operations analysts',
    fullContent: {
      problem: `Trust & Safety operations at a Fortune 50 platform struggled with fragmented policy documentation. Analysts spent hours cross-referencing wikis and databases to make enforcement decisions. The initial proposal—fine-tuning an LLM—was rejected because it produced "black box" answers without citations. In a compliance environment, provenance is mandatory; every answer must link to a specific, active policy clause for audit purposes. Additionally, weekly policy updates made fine-tuning cycles (quarterly at best) too slow to be safe.`,
      architecture: [
        `**I engineered a Hybrid RAG system** decoupling knowledge storage from reasoning.`,

        `**Parent-Child Indexing:** Standard chunking breaks logical context (e.g., separating a "Prohibited" bullet point from its "Exceptions" header). I implemented a Parent-Child Schema using Unstructured.io for document parsing: we index granular 512-token chunks for dense vector matching, but retrieve the full "parent" document window (2048 tokens) for LLM context. This preserves the document structure compliance documentation requires—headers, sub-sections, and exception clauses stay together.`,

        `**Hybrid Search with LanceDB:** Compliance queries are bimodal: exact identifiers ("Policy CP-2847") and conceptual questions ("harassment guidelines"). A single index type fails here. I deployed LanceDB to handle both modes in a single store. Full-Text Search (FTS) is optimized for typo-tolerant keyword and ID matching—when an analyst types "CP-2847", they need that exact document, not semantically similar ones. Dense Vector Search uses BGE-M3 embeddings (multilingual, 8192-token context) to capture semantic meaning across languages and long documents. Cross-Encoder Reranking provides a final pass that re-scores candidates from both indices to guarantee relevance before the LLM sees them. Why LanceDB over Elasticsearch? LanceDB runs serverless with minimal operational overhead. For a Python-centric ML team, managing Elastic clusters was unnecessary complexity. LanceDB's native hybrid search (FTS + vector in one query) simplified the retrieval pipeline significantly.`,

        `**Semantic Routing:** Heuristic routing ("if query contains 'compare' → complex") failed on edge cases. I replaced it with a Semantic Router—the incoming query is embedded and compared against pre-defined intent clusters. Routine Lookups (~70%) route to Gemini 2.0 Flash with sub-second response and minimal cost. Complex Synthesis (~30%) routes to Gemini 1.5 Pro-002 (or Claude 3.5 Sonnet)—slower, expensive, but necessary for multi-document reasoning. The router adds ~20ms latency but reduced inference costs by ~60% compared to routing all traffic to the largest model.`
      ],
      tradeoffs: [
        `**RAG vs. Fine-tuning:** Fine-tuning locks knowledge to a training snapshot. For a domain where policies change weekly, this staleness creates legal risk. RAG allows me to update the index in minutes. Every answer includes source citations—the LLM cannot hallucinate policy that doesn't exist in the retrieved context.`,

        `**LanceDB vs. Separate Indices:** In earlier iterations, I ran separate BM25 (Meilisearch) and vector (LanceDB) stores. The operational overhead wasn't worth it. LanceDB's hybrid search handles both modes adequately, and the simplified architecture reduced deployment complexity.`,

        `**BGE-M3 vs. OpenAI Embeddings:** BGE-M3 is open-source, supports 8192-token contexts (critical for long policy documents), and performs competitively on MTEB benchmarks. Running it locally also avoided API rate limits during high-traffic periods.`
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
      problem: `Manual policy enforcement was unscalable—consuming 68,000+ analyst hours monthly and couldn't keep pace with platform growth. But the blocker to automation wasn't model accuracy; it was legal defensibility. When a user appeals an automated penalty, the legal team needs to explain the decision in plain English. A neural network outputting "0.97 probability of violation" without a reason code is legally insufficient.

Secondary constraint: false positives carry asymmetric risk. Incorrectly penalizing a legitimate user creates legal exposure and trust damage. The cost of a false positive exceeds the cost of missing a true violation (which human reviewers can catch later).`,
      architecture: [
        `**I built a Tiered Decision Engine** using XGBoost, optimized for auditability and precision.`,

        `**Why XGBoost Over Deep Learning:** Neural networks offer higher theoretical capacity, but GBDT was the right choice here. First, native decision-path transparency: XGBoost produces explicit feature splits—I can trace exactly which features contributed to a prediction without post-hoc approximation. Second, tabular data performance: our features were structured (account age, activity counts, flag histories), and GBDT consistently outperforms neural networks on tabular data at our training set size. Third, inference cost: with millions of daily predictions, GBDT inference is orders of magnitude cheaper than neural network inference at this scale. Deep learning would have required complex post-hoc explainability tools (LIME, SHAP on NNs) that are often unstable. GBDT's native interpretability satisfied legal requirements without additional tooling.`,

        `**Calibrated Probability Outputs:** Raw model scores aren't true probabilities. A score of 0.8 doesn't mean "80% chance of violation." I applied Isotonic Calibration to map model outputs to empirical probabilities. Post-calibration, a 0.95 score means "historically, 95% of cases with this score were confirmed violations." This allows policy teams to set dynamic thresholds via GrowthBook (feature flagging): "auto-enforce above 99% confidence this week, 97% next week" without retraining the model.`,

        `**SHAP-Based Explanation Generation:** Every positive prediction generates a SHAP breakdown showing specific feature contributions—for example: "Account creation velocity: +0.23 (created 47 accounts in 24 hours), IP subnet reputation: +0.18 (known proxy network), Content similarity: +0.12 (98% match to known spam template)." This converts mathematical decisions into audit-ready documentation. Legal can point to specific, interpretable reasons during appeals.`,

        `**Feature Serving with Redis:** Features like "posts_last_24h" and "account_age_days" need to be fresh at inference time. I implemented Redis as a lightweight online feature store. Streaming jobs (Airflow-orchestrated) compute aggregated signals and push to Redis. Inference service reads features with <5ms latency. Offline training uses the same feature definitions from Parquet/S3. This ensures training-serving consistency—the model sees the same feature values in production that it was trained on.`,

        `**Staged Deployment Pipeline:** High-stakes ML fails in production in ways offline evaluation doesn't catch. I implemented staged rollout via GrowthBook. Shadow Mode (2 weeks): Model runs on production traffic, predictions logged but no action taken—compared against human decisions, I discovered three feature distribution shifts. Controlled A/B (2 weeks): 5% of traffic receives automated decisions with appeal rates and false positive reports monitored. Gradual Ramp: Traffic percentage increased only after drift monitors confirmed feature stability. Shadow mode added two weeks but prevented incidents I identified during observation.`
      ],
      tradeoffs: [
        `**Precision vs. Recall:** I optimized strictly for precision at the expense of recall. Missing some violations is acceptable (human reviewers catch them); incorrectly penalizing legitimate users is not. Uncertain predictions route to a "grey zone" queue for human review.`,

        `**Redis vs. Heavy Feature Store:** Feast and similar feature stores add operational complexity. For our use case (tens of features, not thousands), Redis + Parquet was sufficient and simpler to maintain.`,

        `**GrowthBook vs. Custom Flagging:** GrowthBook provides audit logs, gradual rollouts, and threshold management out of the box. Building custom flagging would have taken weeks for equivalent functionality.`
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
    projectType: 'Personal Project / Technical Design',
    summary: 'Hybrid edge-cloud architecture delivering sub-3s contextual cues without sending raw audio to the cloud',
    fullContent: {
      problem: `Enterprises block cloud-based meeting assistants (Otter, Fireflies, etc.) due to data leakage risks. IT security reviews routinely reject tools that send raw audio to external servers. Users want real-time contextual cues during meetings ("What did we decide about X?"), but security prohibits sending raw audio to OpenAI or Google.

The challenge: deliver cloud-grade intelligence while keeping raw audio strictly on-device.`,
      architecture: [
        `**I designed a Split-Compute Architecture** with a hard privacy boundary between audio processing and text reasoning.`,

        `**Local Processing Layer (Runs on Device):** All audio handling stays on the user's machine. Audio Capture & VAD segments the microphone stream by Voice Activity Detection, buffering ~2-3 seconds of speech before transcription. ASR via faster-whisper: A distilled Whisper model (small.en or medium.en) runs locally—on Apple Silicon (M1/M2/M3), this delivers ~1-2 second transcription latency for a 3-second chunk. On Intel/AMD, expect 2-4 seconds.`,

        `**PII Redaction via Microsoft Presidio + GLiNER:** Before any text leaves the device, I scan for sensitive entities. Presidio catches standard PII patterns (credit cards, SSNs, phone numbers, emails). GLiNER (Generalist Model for NER) handles zero-shot entity extraction for non-standard sensitive terms (project codenames, internal tool names). Masked output example: "We discussed [PROJECT] with [PERSON] and the budget is [FINANCIAL]." Then scrubbed text streams to cloud via FastAPI WebSockets.`,

        `**Cloud Reasoning Layer (Anonymized Text Only):** The anonymized transcript is sent to Gemini 2.0 Flash for contextual cue generation. The LLM never sees raw audio, never sees PII—only scrubbed text. This separation allows the tool to pass enterprise security reviews that ban cloud recording.`,

        `**Speculative Retrieval:** To minimize perceived latency, the system predicts likely intent during speech pauses (VAD gaps) and pre-fetches relevant context from the meeting knowledge base. When the user finishes speaking, the RAG payload is often already prepared.`,

        `**Latency Budget (Realistic):** Audio buffering ~2,000ms (accumulate coherent speech segment), ASR (faster-whisper) ~1,000-1,500ms (medium.en model, M1/M2), PII redaction ~100ms (Presidio + GLiNER), Network round-trip ~100ms (to cloud LLM), LLM TTFT ~300-500ms (Gemini 2.0 Flash streaming). Total to first token: ~3.5-4s end-to-end. This is honest—the bottleneck is ASR since Whisper wasn't designed for streaming. For non-time-critical queries (summaries, action items), latency matters less and quality matters more.`
      ],
      tradeoffs: [
        `**Local ASR vs. Cloud ASR:** Local ASR is slower than Deepgram or AssemblyAI streaming (~1.5s vs ~300ms). I accepted this latency to guarantee zero raw audio egress. This architectural choice makes the tool compliant with strict IT policies.`,

        `**GLiNER vs. Standard NER:** spaCy's standard NER misses context-dependent sensitive information ("Project Apollo," "Operation Falcon"). GLiNER is heavier but significantly more robust at identifying sensitive codenames without training data—critical for a general-purpose privacy tool.`,

        `**Gemini 2.0 Flash vs. Local LLM:** I could run a local LLM (Llama, Mistral) to keep everything on-device. The quality gap is still significant for nuanced reasoning. Gemini 2.0 Flash offers the best latency/quality trade-off for cloud reasoning in 2026.`
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
      problem: `A partner directory with 50,000+ entities suffered from the "keyword gap." Users searched for business problems ("fix my iOS attribution") while partners listed technical capabilities ("SKAdNetwork implementation certified"). Standard vector search failed because the user's intent didn't semantically match the partner's capability description.

Single-shot LLM queries hallucinated recommendations—the model would confidently recommend partners without verifying they actually had the claimed capabilities. The directory data was self-reported and often stale.

The core issues: users don't know what to search for, and the system can't trust its own data.`,
      architecture: [
        `**I built a Structured State Machine** using LangGraph where agents have explicit roles, typed outputs, and tool access for verification.`,

        `**The Graph Flow:** User Query → Navigator → Strategist → Verifier → Response`,

        `**Agent 1: Navigator (Schema Extraction):** The Navigator doesn't chat aimlessly—it extracts a structured Pydantic schema with problem_category (e.g., "measurement"), specific_issue (e.g., "ios_attribution"), budget_range, region, current_stack, hard_requirements, and soft_preferences. The agent uses Pydantic schema enforcement—it cannot proceed until it produces valid structured output. If the user's query is underspecified, the Navigator asks clarifying questions until it can fill the schema.`,

        `**Agent 2: Strategist (Taxonomy Mapping):** The Strategist maps the user's problem schema to the internal solution taxonomy. "iOS attribution issues" maps to "Mobile Measurement Partner" category with "SKAdNetwork" as a required capability filter. This translation layer converts business language into database query parameters for Qdrant.`,

        `**Agent 3: Verifier (Tool Use):** The Verifier queries Qdrant with the Strategist's filters, then verifies claims before returning results. Index-based verification: For capabilities tracked in structured metadata (certifications, badges), check the database directly—fast. On-demand verification via Tavily: For claims not in structured data, the agent queries Tavily Search API: "Is [Partner X] still a certified Meta Business Partner?" Returns relevant snippets in ~500ms. This is not full website scraping (10+ seconds per site). Tavily provides targeted search results quickly. Full scraping is reserved for offline index enrichment.`,

        `**Why LangGraph Over ReAct Loops:** Standard ReAct (Reasoning + Acting) loops are unpredictable. The agent might loop indefinitely, call the wrong tools, or produce malformed output. LangGraph defines a Finite State Machine (FSM): each node is an agent with a specific role, edges are conditional on output validation, and the system is deterministic—I know exactly which state it's in at any time. When something breaks, the state machine makes it obvious which agent failed and why. This testability was essential for a production system.`
      ],
      tradeoffs: [
        `**Structured Outputs vs. Flexibility:** Forcing Pydantic schema output constrains what the Navigator can express. Some edge cases don't fit the schema cleanly. I accept this limitation in exchange for reliable downstream processing. Edge cases route to a human specialist.`,

        `**Qdrant vs. Pinecone:** Qdrant offers robust payload filtering—I can apply hard filters (Region=US, Certification=SKAdNetwork) alongside semantic queries. Pinecone's filtering is more limited. For this use case, filter quality mattered more than managed convenience.`,

        `**Tavily vs. Full Scraping:** Full website scraping provides richer verification but adds 10+ seconds latency per partner. Tavily provides "good enough" verification for real-time queries. High-stakes recommendations trigger async full verification after the initial response.`
      ]
    },
    impact: [
      { label: 'Searchable entities', value: '50,000+' },
      { label: 'Capability matching', value: 'Verified' },
      { label: 'Conversion depth vs keyword', value: '3x' }
    ],
    technologies: ['Python', 'LangGraph', 'Pydantic', 'Tavily', 'Qdrant']
  }
];
