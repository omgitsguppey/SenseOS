import '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model: mobilenet.MobileNet | null = null;

export async function loadVisionModel() {
  if (model) return model;
  try {
    console.log('🤖 [Vision Engine] Loading MobileNet TFJS Graph into browser memory...');
    model = await mobilenet.load();
    console.log('✅ [Vision Engine] MobileNet TFJS Online!');
    return model;
  } catch (err) {
    console.error('❌ [Vision Engine] Failed to load structural inference matrix:', err);
    throw err;
  }
}

export async function extractSemanticTags(imageElement: HTMLImageElement): Promise<Record<string, number>> {
  if (!model) {
    await loadVisionModel();
  }
  if (!model) return {};

  try {
    const predictions = await model.classify(imageElement, 5); // extract Top 5 probabilities
    
    const tags: Record<string, number> = {};
    predictions.forEach(p => {
      // MobileNet classNames can be comma-separated like "golden retriever, retriever"
      // We slice the strict primary identifier specifically for iOS parity styling!
      const primaryName = p.className.split(',')[0].trim().toLowerCase();
      tags[primaryName] = p.probability;
    });

    console.log('🧠 [Vision Engine] Local Inference Completed:', tags);
    return tags;
  } catch (err) {
    console.error('❌ [Vision Engine] Classification aborted:', err);
    return {};
  }
}
