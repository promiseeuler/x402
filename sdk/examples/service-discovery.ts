/**
 * Service Discovery Example
 * 
 * This example demonstrates how to use the X402 SDK's discovery features:
 * - Finding X402-enabled services
 * - Searching by category and filters
 * - Testing X402 support for URLs
 * - Getting service details and pricing
 */

import { 
  createX402SDK, 
  createDiscoveryClient, 
  discoverServices, 
  checkX402Support,
  SERVICE_CATEGORIES,
  PRICING_MODELS
} from '../src/index.js';

async function serviceDiscoveryExample() {
  console.log('🔍 X402 Service Discovery Example\n');

  try {
    // 1. Create discovery client
    console.log('1. Creating discovery client...');
    const bazaar = createDiscoveryClient();
    console.log('✅ Discovery client created\n');

    // 2. Get available categories
    console.log('2. Getting available service categories...');
    const categories = await bazaar.getCategories();
    console.log('✅ Available categories:');
    categories.forEach(category => {
      console.log(`   - ${category}`);
    });
    console.log();

    // 3. Discover AI services
    console.log('3. Discovering AI services...');
    const aiServices = await bazaar.discoverServices('AI image generation', {
      category: 'ai',
      network: 'somnia',
      priceRange: { max: 1.0 },
      verified: true
    });
    
    console.log(`✅ Found ${aiServices.length} AI services:`);
    aiServices.slice(0, 3).forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name}`);
      console.log(`      URL: ${service.endpoint}`);
      console.log(`      Price: ${service.pricing.amount} ${service.pricing.token}`);
      console.log(`      Rating: ${service.rating}/5 (${service.usage} uses)`);
      console.log(`      Description: ${service.description}`);
      console.log();
    });

    // 4. Search for data services
    console.log('4. Searching for data services...');
    const dataServices = await bazaar.search('weather data API', {
      category: 'data',
      network: 'somnia',
      sortBy: 'rating',
      limit: 5
    });
    
    console.log(`✅ Found ${dataServices.length} data services:`);
    dataServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - ${service.pricing.amount} ${service.pricing.token}`);
    });
    console.log();

    // 5. Get popular services
    console.log('5. Getting popular services...');
    const popularServices = await bazaar.getPopularServices(5);
    console.log(`✅ Top ${popularServices.length} popular services:`);
    popularServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.usage} uses)`);
      console.log(`      Category: ${service.category}`);
      console.log(`      Price: ${service.pricing.amount} ${service.pricing.token}`);
    });
    console.log();

    // 6. Test X402 support for specific URLs
    console.log('6. Testing X402 support for various URLs...');
    const testUrls = [
      'https://api.openai.com/v1/chat/completions',
      'https://api.stability.ai/v1/generation',
      'https://api.example-x402-service.com',
      'https://regular-api.com/data'
    ];

    for (const url of testUrls) {
      console.log(`   Testing: ${url}`);
      const support = await checkX402Support(url);
      
      if (support.supported) {
        console.log(`   ✅ X402 supported`);
        console.log(`      Networks: ${support.networks?.join(', ')}`);
        console.log(`      Payment methods: ${support.paymentMethods?.join(', ')}`);
        if (support.pricing) {
          console.log(`      Pricing: ${support.pricing.amount} ${support.pricing.token}`);
        }
      } else {
        console.log(`   ❌ X402 not supported`);
      }
      console.log();
    }

    // 7. Get detailed service information
    if (aiServices.length > 0) {
      console.log('7. Getting detailed service information...');
      const serviceId = aiServices[0].id;
      const serviceDetails = await bazaar.getService(serviceId);
      
      if (serviceDetails) {
        console.log('✅ Service details:');
        console.log(`   Name: ${serviceDetails.name}`);
        console.log(`   Provider: ${serviceDetails.provider}`);
        console.log(`   Endpoint: ${serviceDetails.endpoint}`);
        console.log(`   Category: ${serviceDetails.category}`);
        console.log(`   Description: ${serviceDetails.description}`);
        console.log(`   Pricing Model: ${serviceDetails.pricing.model}`);
        console.log(`   Price: ${serviceDetails.pricing.amount} ${serviceDetails.pricing.token}`);
        console.log(`   Network: ${serviceDetails.network}`);
        console.log(`   Verified: ${serviceDetails.verified}`);
        console.log(`   Rating: ${serviceDetails.rating}/5`);
        console.log(`   Total Usage: ${serviceDetails.usage}`);
        
        if (serviceDetails.features && serviceDetails.features.length > 0) {
          console.log(`   Features: ${serviceDetails.features.join(', ')}`);
        }
        
        if (serviceDetails.tags && serviceDetails.tags.length > 0) {
          console.log(`   Tags: ${serviceDetails.tags.join(', ')}`);
        }
      }
      console.log();
    }

    // 8. Filter services by price range
    console.log('8. Filtering services by price range...');
    const affordableServices = await bazaar.discoverServices('', {
      priceRange: { min: 0.001, max: 0.1 },
      network: 'somnia',
      sortBy: 'price'
    });
    
    console.log(`✅ Found ${affordableServices.length} affordable services (0.001-0.1 STT):`);
    affordableServices.slice(0, 5).forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - ${service.pricing.amount} ${service.pricing.token}`);
    });
    console.log();

    // 9. Search by specific features
    console.log('9. Searching services with specific features...');
    const mlServices = await bazaar.search('machine learning', {
      category: 'ai',
      features: ['real-time', 'batch-processing'],
      verified: true
    });
    
    console.log(`✅ Found ${mlServices.length} ML services with real-time and batch processing:`);
    mlServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name}`);
      if (service.features) {
        console.log(`      Features: ${service.features.join(', ')}`);
      }
    });
    console.log();

    console.log('🎉 Service discovery example completed successfully!');

  } catch (error) {
    console.error('❌ Service discovery example failed:', error);
  }
}

// Example: Discover and use a service
async function discoverAndUseExample() {
  console.log('\n🚀 Discover and Use Service Example\n');
  
  try {
    // 1. Create SDK and wallet
    const sdk = createX402SDK();
    await sdk.createWallet('discovery-example-password');
    
    // Set spending limits
    sdk.setSpendingLimit('STT', {
      perTransaction: 0.5,
      daily: 2.0
    });
    
    console.log('✅ SDK and wallet ready');
    
    // 2. Discover image generation services
    console.log('\n2. Discovering image generation services...');
    const imageServices = await discoverServices('image generation', 'somnia');
    
    if (imageServices.length === 0) {
      console.log('❌ No image generation services found');
      return;
    }
    
    const selectedService = imageServices[0];
    console.log(`✅ Selected service: ${selectedService.name}`);
    console.log(`   Price: ${selectedService.pricing.amount} ${selectedService.pricing.token}`);
    
    // 3. Use the service
    console.log('\n3. Using the service...');
    const result = await sdk.request(selectedService.endpoint, {
      method: 'POST',
      data: {
        prompt: 'A beautiful sunset over mountains',
        style: 'photorealistic',
        size: '512x512'
      },
      autoPayment: true
    });
    
    if (result.success) {
      console.log('✅ Service request successful!');
      console.log('   Generated image URL:', result.data?.imageUrl);
    } else {
      console.log('❌ Service request failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Discover and use example failed:', error);
  }
}

// Example: Service marketplace functionality
async function marketplaceExample() {
  console.log('\n🏪 Service Marketplace Example\n');
  
  try {
    const bazaar = createDiscoveryClient();
    
    // 1. Browse by categories
    console.log('1. Browsing services by category...');
    for (const category of SERVICE_CATEGORIES.slice(0, 3)) {
      console.log(`\n   📂 ${category.toUpperCase()} Services:`);
      const services = await bazaar.discoverServices('', {
        category,
        limit: 3,
        sortBy: 'rating'
      });
      
      services.forEach((service, index) => {
        console.log(`      ${index + 1}. ${service.name}`);
        console.log(`         💰 ${service.pricing.amount} ${service.pricing.token}`);
        console.log(`         ⭐ ${service.rating}/5`);
        console.log(`         📊 ${service.usage} uses`);
      });
    }
    
    // 2. Compare pricing models
    console.log('\n2. Comparing pricing models...');
    for (const model of PRICING_MODELS) {
      const services = await bazaar.discoverServices('', {
        pricingModel: model,
        limit: 2
      });
      
      console.log(`\n   💳 ${model.toUpperCase()} Pricing:`);
      services.forEach(service => {
        console.log(`      - ${service.name}: ${service.pricing.amount} ${service.pricing.token}`);
      });
    }
    
    console.log('\n🎉 Marketplace example completed!');
    
  } catch (error) {
    console.error('❌ Marketplace example failed:', error);
  }
}

// Run examples
if (require.main === module) {
  serviceDiscoveryExample()
    .then(() => discoverAndUseExample())
    .then(() => marketplaceExample())
    .catch(console.error);
}

export { 
  serviceDiscoveryExample, 
  discoverAndUseExample, 
  marketplaceExample 
};