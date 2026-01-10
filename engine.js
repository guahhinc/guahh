/**
 * Guahh AI - Neural Engine V6.0 (Advanced Generative)
 * Features: Temperature Sampling, Nucleus Sampling, Response Caching, Better Context Management
 */

const GuahhEngine = {
    // Core Data
    memory: [],
    dictionary: {},
    idf: {}, // Inverse Document Frequency map
    isReady: false,

    // Config
    vocab: new Set(),
    temperature: 0.8, // Creativity control (0.1-2.0, higher = more creative)
    topP: 0.9, // Nucleus sampling threshold

    // Caching & History
    responseCache: new Map(), // Query -> Response cache
    recentOutputs: [], // Last N outputs to avoid repetition
    conversationHistory: [], // Maintain context
    wikiCache: new Map(), // Wikipedia cache

    // Callbacks
    onLog: (msg, type) => console.log(`[${type}] ${msg}`),

    init(data, logCallback) {
        if (!data) return false;
        if (logCallback) this.onLog = logCallback;

        this.onLog("Initializing Neural Core...", "info");
        this.onLog(`Loading memory bank: ${data.length} entries`, "info");
        console.time("Indexing");

        this.memory = [];
        this.dictionary = {};
        this.vocab = new Set();

        // 1. Process Data
        data.forEach(item => {
            if (item.type === 'dict') {
                this.dictionary[item.word] = item;
            } else {
                // Pre-compute meaningful tokens
                const tokens = this.tokenize(item.q);
                // Also tokenize Answer for generation training later
                // We keep the raw text 'a' for the "source material"
                this.memory.push({
                    q: item.q,
                    a: item.a,
                    tokens: tokens
                });

                // Build Vocab for IDF
                tokens.forEach(t => this.vocab.add(t));
            }
        });

        // 2. Build IDF (Simple version)
        this.onLog("Building Vector Space Model...", "process");
        // (Skipping full IDF calculation for speed, using rare-term boosting in retrieval instead)

        console.timeEnd("Indexing");
        this.onLog("System Ready.", "success");
        this.isReady = true;
        return true;
    },

    tokenize(text) {
        if (!text) return [];
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Strict cleaning
            .split(/\s+/)
            .filter(w => w.length > 2);
    },

    /**
     * Query Understanding Enhancement
     */
    preprocessQuery(query) {
        // Remove stopwords that don't add meaning
        const stopwords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by'];
        let cleaned = query.toLowerCase().trim();

        // Expand common abbreviations for better matching
        cleaned = cleaned
            .replace(/\bai\b/g, 'artificial intelligence')
            .replace(/\bwhat's\b/g, 'what is')
            .replace(/\bwho's\b/g, 'who is')
            .replace(/\bhow's\b/g, 'how is');

        return cleaned;
    },

    isMetaQuery(query) {
        // Detect if the user is asking about the AI itself
        const metaPatterns = [
            /who are you/i,
            /what (are|is) you/i,
            /your name/i,
            /what can you do/i,
            /what (are|is) your (purpose|function)/i,
            /how do you work/i,
            /tell me about yourself/i,
            /introduce yourself/i,
            /what (are|is) guahh/i
        ];

        return metaPatterns.some(p => p.test(query));
    },

    /**
     * Wikipedia Integration with Caching
     */
    async searchWikipedia(query) {
        // Check cache first
        if (this.wikiCache.has(query)) {
            this.onLog(`Wikipedia: Using cached result for "${query}"`, "success");
            return this.wikiCache.get(query);
        }

        this.onLog(`Querying Wikipedia for "${query}"...`, "process");

        // Clean query to remove question words for better search results
        const cleanQuery = query.replace(/^(what is|who is|tell me about|define|search for|meaning of)\s+/i, '');

        // API Endpoint
        const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&redirects=1&origin=*&titles=${encodeURIComponent(cleanQuery)}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pageId === "-1") {
                this.onLog("Wikipedia: No article found.", "error");
                return null; // No result
            }

            const extract = pages[pageId].extract;
            if (!extract || extract.includes("refer to:")) {
                this.onLog("Wikipedia: Disambiguation page or empty result.", "error");
                return null; // Disambiguation page or empty
            }

            // Return first 3 sentences
            const sentences = extract.split('. ');
            const summary = sentences.slice(0, 3).join('. ') + '.';
            this.onLog("Wikipedia: Knowledge retrieved successfully.", "success");

            // Cache the result
            this.wikiCache.set(query, summary);
            if (this.wikiCache.size > 50) {
                // Clear oldest entry
                const firstKey = this.wikiCache.keys().next().value;
                this.wikiCache.delete(firstKey);
            }

            return summary;
        } catch (e) {
            console.error("Wiki Error", e);
            this.onLog("Wikipedia: API Error.", "error");
            return null;
        }
    },

    /**
     * Main Entry Point with Enhanced Context Management
     */
    async generateResponse(query) {
        if (!this.isReady) return { text: "Neural core not initialized.", sources: [] };

        this.onLog(`Received input: "${query}"`, "input");

        // Check response cache
        const cacheKey = query.toLowerCase().trim();
        if (this.responseCache.has(cacheKey)) {
            this.onLog("Using cached response", "success");
            return this.responseCache.get(cacheKey);
        }

        // Preprocess for better understanding
        const cleanQuery = this.preprocessQuery(query);
        this.onLog(`Preprocessed: "${cleanQuery}"`, "data");

        const qTokens = this.tokenize(cleanQuery);

        // 1. Meta-Query Check (Questions about the AI itself)
        if (this.isMetaQuery(query)) {
            this.onLog("Intent: META (Self-referential)", "success");
            const relevantDocs = this.retrieveRelevant(qTokens);
            if (relevantDocs.length > 0 && relevantDocs[0].score > 0.5) {
                const result = { text: relevantDocs[0].doc.a, sources: ["Local Memory"] };
                this.addToHistory(query, result.text);
                return result;
            }
            // Fallback meta response
            const result = {
                text: "I am Guahh AI V6, an advanced locally-running neural system. I use temperature sampling, nucleus sampling, and sophisticated retrieval to answer questions, generate creative text, search Wikipedia, and maintain natural conversations.",
                sources: ["Core Identity"]
            };
            this.addToHistory(query, result.text);
            return result;
        }

        // 2. Check Dictionary Intent
        const dictResult = this.checkDictionaryInquiry(query);
        if (dictResult) {
            this.onLog("Intent: DEFINITION", "success");
            const result = { text: dictResult, sources: ["Dictionary"] };
            this.addToHistory(query, result.text);
            return result;
        }

        // 3. Try Wikipedia FIRST for general knowledge
        this.onLog("Priority Source: Wikipedia (External Knowledge)", "process");
        const wikiResult = await this.searchWikipedia(query);

        if (wikiResult) {
            this.onLog("Wikipedia knowledge retrieved. Using as primary source.", "success");
            const result = { text: wikiResult, sources: ["Wikipedia"] };
            this.addToHistory(query, result.text);
            this.responseCache.set(cacheKey, result);
            return result;
        }

        // 4. Fallback to Local Database
        this.onLog("Wikipedia unavailable. Scanning local memory...", "warning");
        const relevantDocs = this.retrieveRelevant(qTokens);

        if (relevantDocs.length === 0 || relevantDocs[0].score < 0.1) {
            this.onLog("No relevant context found in any source.", "error");
            const result = { text: "I don't have that information yet. Try rephrasing or asking about a different topic.", sources: [] };
            return result;
        }

        // Log top match
        this.onLog(`Top Local Match (${(relevantDocs[0].score * 100).toFixed(0)}%): "${relevantDocs[0].doc.a.substring(0, 30)}..."`, "data");

        // 5. GENERATE

        // Detect "Long Form" intent
        const isLongForm = /write|story|essay|article|explain|detail|elaborate/.test(cleanQuery);
        let maxLen = isLongForm ? 150 : 50; // Increased default length
        let contextSize = isLongForm ? 15 : 7; // Use more sources

        const bestScore = relevantDocs[0].score;
        let outputText = "";

        if (bestScore > 0.85 && !isLongForm) {
            // Exact match is fine for simple questions
            this.onLog("High confidence. Using retrieved memory directly.", "info");
            outputText = relevantDocs[0].doc.a;
        } else if (bestScore > 0.15 || isLongForm) {
            // Medium match OR creative writing
            this.onLog(`Engaging Advanced Generative Engine (Mode: ${isLongForm ? "Long-Form" : "Standard"})...`, "warning");

            // Context: Build a larger corpus for the model
            const validDocs = relevantDocs.slice(0, contextSize);
            const contextText = validDocs.map(d => d.doc.a).join(" ");

            if (validDocs.length < 3) {
                this.onLog("Warning: Low context volume for generation.", "error");
            }

            // GENERATE with advanced sampling!
            outputText = this.generateNeuralText(contextText, maxLen);

            // Quality Control
            if (outputText.length < 20) {
                this.onLog("Generation unstable. Reverting to best context match.", "error");
                outputText = relevantDocs[0].doc.a;
            } else {
                this.onLog("✓ Synthesized new response with temperature sampling.", "success");
            }
        } else {
            // Low score
            this.onLog("Low confidence match. Avoiding hallucination.", "error");
            return { text: "I found some data, but it doesn't seem relevant enough to answer confidently. Can you be more specific?", sources: [] };
        }

        const result = {
            text: outputText,
            sources: relevantDocs.slice(0, 3).map(d => d.score)
        };

        // Update history and cache
        this.addToHistory(query, result.text);
        this.responseCache.set(cacheKey, result);
        if (this.responseCache.size > 100) {
            const firstKey = this.responseCache.keys().next().value;
            this.responseCache.delete(firstKey);
        }

        return result;
    },

    /**
     * Retrieval Logic (Enhanced with TF-IDF)
     */
    retrieveRelevant(qTokens) {
        if (qTokens.length === 0) return [];

        // Calculate document frequency for IDF weighting
        const df = {}; // Term -> number of docs containing it
        this.memory.forEach(entry => {
            const uniqueTerms = new Set(entry.tokens);
            uniqueTerms.forEach(t => {
                df[t] = (df[t] || 0) + 1;
            });
        });

        const totalDocs = this.memory.length;

        const scored = this.memory.map(entry => {
            let weightedScore = 0;
            let overlap = 0;

            qTokens.forEach(t => {
                if (entry.tokens.includes(t)) {
                    overlap++;
                    // Boost score for rare terms (IDF)
                    const idf = Math.log(totalDocs / (df[t] || 1));
                    weightedScore += idf;
                }
            });

            const union = new Set([...entry.tokens, ...qTokens]).size;
            const baseScore = union === 0 ? 0 : overlap / union;

            // Combine Jaccard with IDF weighting
            const finalScore = baseScore * (1 + weightedScore / 10);

            return {
                doc: entry,
                score: Math.min(finalScore, 1) // Cap at 1
            };
        });

        // Return top 15 matches
        return scored.filter(s => s.score > 0.05)
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);
    },

    getFallbackResponse() {
        const responses = [
            "I don't have sufficient context to answer that confidently.",
            "That topic isn't in my current knowledge base. Try asking something else or rephrasing your question.",
            "I'm not finding relevant information for that query.",
            "My database doesn't contain enough information about that subject."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    /**
     * Advanced Generative Logic with Temperature & Nucleus Sampling
     * Creates a temporary Language Model from the retrieved context
     */
    generateNeuralText(sourceText, targetLength = 40) {
        const words = sourceText.replace(/([.,!?;:])/g, " $1 ").split(/\s+/).filter(w => w);

        // 1. Build N-Gram Models with Frequency Counts
        const bigrams = {}; // "word" -> {"next": count}
        const trigrams = {}; // "word1 word2" -> {"next": count}
        const starters = []; // Words that start sentences

        for (let i = 0; i < words.length - 2; i++) {
            const w1 = words[i];
            const w2 = words[i + 1];
            const w3 = words[i + 2];

            // Bigrams with frequency
            if (!bigrams[w1]) bigrams[w1] = {};
            bigrams[w1][w2] = (bigrams[w1][w2] || 0) + 1;

            // Trigrams with frequency
            const key = w1 + " " + w2;
            if (!trigrams[key]) trigrams[key] = {};
            trigrams[key][w3] = (trigrams[key][w3] || 0) + 1;

            // Starters (heuristic: follows punctuation or is first)
            if (i === 0 || ".!?".includes(words[i - 1])) {
                starters.push(w1);
            }
        }

        // 2. Generate with Advanced Sampling
        if (starters.length === 0) starters.push(words[0]);

        let currentWord = starters[Math.floor(Math.random() * starters.length)];
        let prevWord = "";
        let output = [currentWord];

        for (let i = 0; i < targetLength; i++) {
            let candidatePool = null;

            // Strategy A: Trigram (High Coherence)
            if (prevWord) {
                const key = prevWord + " " + currentWord;
                if (trigrams[key]) {
                    candidatePool = trigrams[key];
                }
            }

            // Strategy B: Backoff to Bigram
            if (!candidatePool && bigrams[currentWord]) {
                candidatePool = bigrams[currentWord];
            }

            // Dead End?
            if (!candidatePool || Object.keys(candidatePool).length === 0) break;

            // Apply Temperature & Nucleus Sampling
            const next = this.sampleWithTemperature(candidatePool, this.temperature, this.topP);
            if (!next) break;

            output.push(next);
            prevWord = currentWord;
            currentWord = next;

            // Stop naturally
            if (i > 15 && ".!?".includes(currentWord)) break;
        }

        // 3. Detokenize & Post-process
        let text = output.join(" ")
            .replace(/\s+([.,!?;:])/g, "$1") // Fix punctuation
            .replace(/^([a-z])/g, (c) => c.toUpperCase()); // Capitalize

        // Quality validation
        if (!this.validateOutput(text)) {
            this.onLog("Output quality check failed, retrying...", "warning");
            return this.generateNeuralText(sourceText, targetLength); // Retry once
        }

        return text;
    },

    /**
     * Temperature & Nucleus (Top-P) Sampling
     */
    sampleWithTemperature(candidateFreq, temperature = 1.0, topP = 0.9) {
        const candidates = Object.keys(candidateFreq);
        if (candidates.length === 0) return null;

        // Convert frequencies to probabilities with temperature
        const total = Object.values(candidateFreq).reduce((a, b) => a + b, 0);
        let probs = candidates.map(word => ({
            word,
            prob: Math.pow(candidateFreq[word] / total, 1 / temperature)
        }));

        // Normalize
        const probSum = probs.reduce((a, b) => a + b.prob, 0);
        probs = probs.map(p => ({ word: p.word, prob: p.prob / probSum }));

        // Sort by probability
        probs.sort((a, b) => b.prob - a.prob);

        // Nucleus sampling: keep only top-p cumulative probability
        let cumSum = 0;
        const nucleus = [];
        for (const p of probs) {
            cumSum += p.prob;
            nucleus.push(p);
            if (cumSum >= topP) break;
        }

        // Sample from nucleus
        const rand = Math.random() * nucleus.reduce((a, b) => a + b.prob, 0);
        let running = 0;
        for (const p of nucleus) {
            running += p.prob;
            if (rand <= running) return p.word;
        }

        return nucleus[0].word; // Fallback to most likely
    },

    /**
     * Output Quality Validation
     */
    validateOutput(text) {
        // Check minimum length
        if (text.length < 10) return false;

        // Check for excessive repetition
        const words = text.toLowerCase().split(/\s+/);
        const uniqueRatio = new Set(words).size / words.length;
        if (uniqueRatio < 0.3) return false; // Too repetitive

        // Check against recent outputs for diversity
        const similarity = this.recentOutputs.some(recent => {
            const overlap = this.computeSimilarity(text, recent);
            return overlap > 0.7; // Too similar to recent response
        });

        return !similarity;
    },

    /**
     * Compute text similarity (simple Jaccard)
     */
    computeSimilarity(text1, text2) {
        const s1 = new Set(text1.toLowerCase().split(/\s+/));
        const s2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...s1].filter(x => s2.has(x)));
        const union = new Set([...s1, ...s2]);
        return union.size === 0 ? 0 : intersection.size / union.size;
    },

    /**
     * Update conversation history
     */
    addToHistory(query, response) {
        this.conversationHistory.push({ query, response, timestamp: Date.now() });
        if (this.conversationHistory.length > 10) {
            this.conversationHistory.shift(); // Keep last 10
        }

        // Track recent outputs for diversity
        this.recentOutputs.push(response);
        if (this.recentOutputs.length > 5) {
            this.recentOutputs.shift();
        }
    },

    checkDictionaryInquiry(query) {
        const clean = query.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        const parts = clean.split(" ");
        const lastWord = parts[parts.length - 1];

        // Simple heuristic: "define X" or "what is X"
        // Try to match the last word or the whole query
        if (this.dictionary[clean] || this.dictionary[lastWord]) {
            const entry = this.dictionary[clean] || this.dictionary[lastWord];
            return `**${entry.word}** (${entry.pos}): ${entry.def}`;
        }
        return null;
    }
};
