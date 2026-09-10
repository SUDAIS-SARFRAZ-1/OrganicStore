import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sliders, 
  MessageSquare, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowUp,
  ArrowDown,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  getAdminHomeSections, 
  updateHomeSection, 
  getAdminTestimonials, 
  updateHomeTestimonials, 
  deleteAdminTestimonial,
  getAdminBrands, 
  updateHomeBrands 
} from '../../services/adminApi';

export default function Content() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sections');
  const [savedFeedback, setSavedFeedback] = useState('');

  // 1. Fetch Home Sections
  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ['homeSections'],
    queryFn: getAdminHomeSections,
  });

  // 2. Fetch Testimonials
  const { data: testimonialsData = [], isLoading: loadingTestimonials } = useQuery({
    queryKey: ['homeTestimonials'],
    queryFn: getAdminTestimonials,
  });

  // 3. Fetch Brands
  const { data: brandsData = [] } = useQuery({
    queryKey: ['homeBrands'],
    queryFn: getAdminBrands,
  });

  const [testimonials, setTestimonials] = useState([]);

  // Sync state when queries resolve
  useEffect(() => {
    if (testimonialsData && testimonialsData.length > 0) {
      setTestimonials([...testimonialsData].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    }
  }, [testimonialsData]);

  // Section update mutation
  const sectionMutation = useMutation({
    mutationFn: ({ id, data }) => updateHomeSection({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['homeSections']);
      showFeedback('Homepage marketing banner updated successfully!');
    },
  });

  // Testimonials update mutation
  const testimonialsMutation = useMutation({
    mutationFn: updateHomeTestimonials,
    onSuccess: () => {
      queryClient.invalidateQueries(['homeTestimonials']);
      queryClient.invalidateQueries(['testimonials']);
      showFeedback('Homepage testimonials and display preference saved!');
    },
  });

  // Brands update mutation
  const brandsMutation = useMutation({
    mutationFn: updateHomeBrands,
    onSuccess: () => {
      queryClient.invalidateQueries(['homeBrands']);
      showFeedback('Partner brand logos updated!');
    },
  });

  const showFeedback = (msg) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(''), 4000);
  };

  const handleAddTestimonial = () => {
    const newItem = {
      id: `new-${Date.now()}`,
      authorName: 'Verified Customer',
      authorRole: 'Verified Buyer',
      rating: 5,
      content: 'Fresh, vibrant organic quality delivered straight to our doorstep!',
      avatarUrl: '',
      sortOrder: testimonials.length + 1,
      isActive: true,
    };
    setTestimonials([...testimonials, newItem]);
  };

  const handleMoveTestimonial = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;
    const updated = [...testimonials];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    const resequenced = updated.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    setTestimonials(resequenced);
  };

  const handleToggleTestimonialActive = (index) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], isActive: !updated[index].isActive };
    setTestimonials(updated);
  };

  const handleDeleteTestimonial = (id, index) => {
    if (id && !id.startsWith('new-')) {
      deleteAdminTestimonial(id).catch(console.error);
    }
    const updated = testimonials.filter((_, idx) => idx !== index);
    setTestimonials(updated);
  };

  const handleTestimonialChange = (index, field, value) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: value };
    setTestimonials(updated);
  };

  const handleSaveTestimonials = () => {
    testimonialsMutation.mutate(testimonials);
  };

  const handleSectionSave = (sec) => {
    sectionMutation.mutate({
      id: sec.id,
      data: {
        title: sec.title,
        subtitle: sec.subtitle,
        linkUrl: sec.linkUrl,
        bannerImage: sec.bannerImage,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#6a9739]" />
            Marketing & Storefront Content CMS
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Customize homepage hero headlines, promo banners, customer testimonials, and partner brand logos without redeploying code.
          </p>
        </div>

        {savedFeedback && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#6a9739]" />
            <span>{savedFeedback}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'sections'
              ? 'border-[#6a9739] text-[#6a9739]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Homepage Banners & Rows
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('testimonials')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'testimonials'
              ? 'border-[#6a9739] text-[#6a9739]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Customer Testimonials
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('brands')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'brands'
              ? 'border-[#6a9739] text-[#6a9739]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Partner Brand Logos
        </button>
      </div>

      {/* Tab 1: Marketing Sections */}
      {activeTab === 'sections' && (
        <div className="space-y-5">
          {loadingSections ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
              <p className="text-xs text-gray-400">Loading sections...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-xs text-gray-400">
              No editable marketing sections configured yet.
            </div>
          ) : (
            sections.map((sec) => (
              <div
                key={sec.id}
                className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-green-50 text-[#6a9739] text-[10px] font-bold rounded-lg uppercase">
                      {sec.type}
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900">{sec.title}</h3>
                  </div>

                  <button
                    type="button"
                    disabled={sectionMutation.isPending}
                    onClick={() => handleSectionSave(sec)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Banner</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Headline / Title</label>
                    <input
                      type="text"
                      defaultValue={sec.title}
                      onChange={(e) => { sec.title = e.target.value; }}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Subtitle / Subtext</label>
                    <input
                      type="text"
                      defaultValue={sec.subtitle || ''}
                      onChange={(e) => { sec.subtitle = e.target.value; }}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Call-To-Action Link URL</label>
                    <input
                      type="text"
                      defaultValue={sec.linkUrl || ''}
                      onChange={(e) => { sec.linkUrl = e.target.value; }}
                      placeholder="/shop or /category/groceries"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Banner Background Image URL</label>
                    <input
                      type="url"
                      defaultValue={sec.bannerImage || ''}
                      onChange={(e) => { sec.bannerImage = e.target.value; }}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Testimonials */}
      {activeTab === 'testimonials' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#6a9739]" />
                <span>Homepage Customer Reviews &amp; Testimonials</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Arrange testimonials according to your preference. Only active testimonials appear on the homepage, in the exact sequence (#1, #2, #3) below.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleAddTestimonial}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Testimonial</span>
              </button>

              <button
                type="button"
                disabled={testimonialsMutation.isPending}
                onClick={handleSaveTestimonials}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Preferences</span>
              </button>
            </div>
          </div>

          {loadingTestimonials ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
              <p className="text-xs text-gray-400">Loading testimonials...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
              No testimonials configured. You can promote customer reviews directly from the Reviews Moderation tab or click "+ Add Testimonial" above.
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className={`p-5 rounded-2xl border transition-all duration-200 ${
                    t.isActive
                      ? 'bg-white border-gray-200 shadow-xs'
                      : 'bg-gray-50/70 border-dashed border-gray-300 opacity-75'
                  }`}
                >
                  {/* Top Bar of each testimonial */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#6a9739] text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        Preference Priority #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveTestimonial(idx, 'up')}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          idx === 0
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 text-gray-700 hover:border-[#6a9739] hover:text-[#6a9739]'
                        }`}
                        title="Move Up (Higher Priority)"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === testimonials.length - 1}
                        onClick={() => handleMoveTestimonial(idx, 'down')}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          idx === testimonials.length - 1
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 text-gray-700 hover:border-[#6a9739] hover:text-[#6a9739]'
                        }`}
                        title="Move Down (Lower Priority)"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Active on Homepage Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleTestimonialActive(idx)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          t.isActive
                            ? 'bg-green-50 text-[#6a9739] border border-green-200 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                        title="Toggle visibility on Homepage"
                      >
                        {t.isActive ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Live on Home</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hidden on Home</span>
                          </>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(t.id, idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete this testimonial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={t.authorName || ''}
                        onChange={(e) => handleTestimonialChange(idx, 'authorName', e.target.value)}
                        placeholder="e.g. Ayesha Khan"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Role / Verified Product Tag
                      </label>
                      <input
                        type="text"
                        value={t.authorRole || ''}
                        onChange={(e) => handleTestimonialChange(idx, 'authorRole', e.target.value)}
                        placeholder="e.g. Verified Buyer • Farm Fresh Apples"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Rating (1 to 5 Stars)
                      </label>
                      <div className="flex items-center gap-1 py-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleTestimonialChange(idx, 'rating', star)}
                            className="cursor-pointer"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= (t.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-gray-600 ml-2">
                          {t.rating || 5} / 5
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-bold text-gray-700 mb-1">
                        Customer Feedback Quote
                      </label>
                      <textarea
                        rows={2}
                        value={t.content || ''}
                        onChange={(e) => handleTestimonialChange(idx, 'content', e.target.value)}
                        placeholder="Customer's feedback review..."
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739] resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Brands */}
      {activeTab === 'brands' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900">
              Partner Brand Logos (Footer & Homepage Strip)
            </h3>
            <button
              type="button"
              disabled={brandsMutation.isPending}
              onClick={() => brandsMutation.mutate(brandsData)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Brands</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {brandsData.map((b, idx) => (
              <div key={b.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2 text-xs text-center">
                <img
                  src={b.logoUrl || 'https://via.placeholder.com/100x40?text=Brand'}
                  alt={b.name}
                  className="h-10 mx-auto object-contain"
                />
                <input
                  type="text"
                  defaultValue={b.name}
                  onChange={(e) => { b.name = e.target.value; }}
                  className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-center text-[11px] font-bold"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
