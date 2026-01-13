import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  Grid3x3,
  Monitor,
  Share2,
  Shapes,
  Layout,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/ui/Button';

const INTENT_TEMPLATES = [
  {
    id: 'logo_prep',
    title: 'Logo Prep',
    description: 'Clean, vectorize, and prepare logos for print/embroidery',
    icon: Sparkles,
    tags: ['Production', 'Embroidery'],
    color: 'from-red-50 to-red-50',
    iconColor: 'text-brand-primary',
    disabled: false,
    workflow: [
      'Upload logo',
      'Auto vectorize',
      'Detect color count',
      'Preview embroidery constraints',
      'Export EPS/SVG/PDF',
    ],
    canvasSetup: {
      uploadFirst: true,
      tools: ['vectorize', 'remove-bg', 'color-analysis'],
      suggestedPrompts: [],
      outputFormats: ['eps', 'svg', 'pdf'],
    },
  },
  {
    id: 'visualization',
    title: 'Visualization',
    description: 'Apply logos to products with consistent angles & lighting',
    icon: Monitor,
    tags: ['Catalog', 'Sales'],
    color: 'from-red-50 to-red-50',
    iconColor: 'text-brand-primary',
    disabled: true,
    workflow: [
      'Select product (shirt, cap, hoodie)',
      'Select logo',
      'Auto placement',
      'Generate 5-10 compliant mockups',
      'Export ZIP',
    ],
    canvasSetup: {
      productMode: true,
      tools: ['ai-generate', 'product-placement', 'batch-export'],
      suggestedPrompts: [
        'Professional product photography of white t-shirt on model',
        'Clean studio shot of black cap front view',
        'Lifestyle mockup of hoodie in modern workspace',
      ],
      batchMode: true,
    },
  },
  {
    id: 'batch_branding',
    title: 'Batch Branding',
    description: 'Apply one design across multiple products or variants',
    icon: Grid3x3,
    tags: ['Batch', 'Enterprise'],
    color: 'from-red-50 to-red-50',
    iconColor: 'text-brand-primary',
    disabled: true,
    workflow: [
      'Upload logo once',
      'Select product set',
      'Batch generate',
      'Track job status',
      'Export all',
    ],
    canvasSetup: {
      batchMode: true,
      multiProduct: true,
      tools: ['batch-generation', 'product-placement', 'job-queue'],
      suggestedPrompts: [],
      queueSupport: true,
    },
  },
  {
    id: 'standardization',
    title: 'Standardization',
    description: 'Create vendor-ready logo and asset packs',
    icon: Shapes,
    tags: ['Compliance', 'Vendors'],
    color: 'from-red-50 to-red-50',
    iconColor: 'text-brand-primary',
    disabled: true,
    workflow: [
      'Detect variants',
      'Normalize colors',
      'Generate light/dark versions',
      'Export organized folders',
    ],
    canvasSetup: {
      uploadFirst: true,
      tools: ['vectorize', 'color-normalize', 'variant-generation'],
      suggestedPrompts: [],
      exportStructured: true,
    },
  },
  {
    id: 'advanced_workflow',
    title: 'Advanced Workflow',
    description: 'Full control for edge cases and special projects',
    icon: Layout,
    tags: ['Advanced'],
    color: 'from-red-50 to-red-50',
    iconColor: 'text-brand-primary',
    disabled: true,
    workflow: [
      'Access all tools',
      'Custom configurations',
      'Manual adjustments',
    ],
    canvasSetup: {
      size: 'auto',
      tools: 'all',
      suggestedPrompts: [
        'A futuristic cityscape at sunset',
        'Abstract geometric pattern in bold colors',
        'Minimalist illustration of a mountain landscape',
      ],
    },
  },
];

const IntentSelector = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();

  const handleIntentSelect = (intent) => {
    const serializableIntent = {
      id: intent.id,
      title: intent.title,
      description: intent.description,
      tags: intent.tags,
      canvasSetup: intent.canvasSetup,
    };
    
    try {
      navigate(`/project/${uuid}`, {
        state: { intent: serializableIntent },
      });
    } catch (error) {
      alert(`Navigation error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo height={32} />
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/projects')}
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            What are you working on?
          </h1>
          <p className="text-base text-gray-600 font-sans">
            Choose a workflow. We'll handle the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTENT_TEMPLATES.map((intent) => {
            const IconComponent = intent.icon;
            const isDisabled = intent.disabled;
            
            return (
              <button
                key={intent.id}
                onClick={() => !isDisabled && handleIntentSelect(intent)}
                disabled={isDisabled}
                className={`group relative bg-white rounded-xl p-4 border-2 transition-all duration-150 text-left ${
                  isDisabled
                    ? 'border-gray-200 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 hover:border-brand-primary hover:shadow-lg cursor-pointer'
                }`}
              >
                {isDisabled && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                      Coming Soon
                    </span>
                  </div>
                )}
                
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-150 ${
                    isDisabled
                      ? 'bg-gray-50'
                      : 'bg-red-50 group-hover:bg-red-100'
                  }`}>
                    <IconComponent 
                      className={isDisabled ? 'text-gray-400' : 'text-brand-primary'} 
                      size={22} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-heading text-base font-bold mb-1 transition-colors ${
                      isDisabled
                        ? 'text-gray-500'
                        : 'text-gray-900 group-hover:text-brand-primary'
                    }`}>
                      {intent.title}
                    </h3>
                    <p className={`text-xs leading-snug mb-2 font-sans ${
                      isDisabled ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {intent.description}
                    </p>
                    {intent.workflow && (
                      <ul className={`text-xs space-y-0.5 font-sans ${
                        isDisabled ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {intent.workflow.slice(0, 3).map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className={isDisabled ? 'text-gray-300 mt-0.5' : 'text-brand-primary mt-0.5'}>
                              •
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                        {intent.workflow.length > 3 && (
                          <li className="text-gray-400 ml-3.5">
                            +{intent.workflow.length - 3} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {intent.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded-lg font-medium font-sans ${
                        isDisabled
                          ? 'bg-gray-50 text-gray-400'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 font-sans">
            More workflows coming soon
          </p>
        </div>
      </main>
    </div>
  );
};

export default IntentSelector;

