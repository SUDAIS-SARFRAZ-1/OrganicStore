import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Truck,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  MapPin,
  CreditCard,
  FileText,
  Leaf,
  Tag,
  Lock,
} from 'lucide-react';
import { getCart } from '../services/cartApi';
import { createOrder } from '../services/orderApi';
import { validateCoupon } from '../services/couponApi';
import { processDirectCardPayment } from '../services/paymentApi';
import { useAuthStore } from '../store/authStore';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Load active cart
  const { data: cart = { items: [], totalItems: 0, subtotal: 0 }, isLoading: isCartLoading } =
    useQuery({
      queryKey: ['cart'],
      queryFn: getCart,
    });

  // State for shipping address
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: 'Lahore',
    state: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
  });

  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardholderName: user?.name || '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(location.state?.appliedCoupon || null);
  const [couponError, setCouponError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardDetails((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardDetails((prev) => ({ ...prev, expiry: raw }));
  };

  const handleCvcChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardDetails((prev) => ({ ...prev, cvc: raw }));
  };

  const fillTestCard = () => {
    setCardDetails({
      cardholderName: shippingAddress.recipientName || user?.name || 'Organic Shopper',
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/28',
      cvc: '123',
    });
  };

  // Check if redirected back due to Stripe cancellation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('cancelled') === 'true') {
      setErrorMessage('Online payment was interrupted. You can choose Cash on Delivery or retry Stripe payment below.');
    }
  }, [location.search]);

  // Coupon validation mutation
  const couponMutation = useMutation({
    mutationFn: validateCoupon,
    onSuccess: (data) => {
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponError('');
      }
    },
    onError: (err) => {
      setCouponError(err.message || 'Invalid coupon code.');
    },
  });

  // Order placement mutation (Rule 5 & 25)
  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (newOrder) => {
      // Invalidate cart in React Query so cart badge resets to 0
      queryClient.invalidateQueries({ queryKey: ['cart'] });

      if (paymentMethod === 'STRIPE') {
        try {
          setIsRedirectingToStripe(true);
          const payRes = await processDirectCardPayment({
            orderId: newOrder.id,
            cardholderName: cardDetails.cardholderName,
            cardNumber: cardDetails.cardNumber,
            expiry: cardDetails.expiry,
            cvc: cardDetails.cvc,
          });

          if (payRes?.order) {
            navigate(`/order-success/${newOrder.orderNumber}`, { state: { order: payRes.order } });
            return;
          }
        } catch (cardErr) {
          setIsRedirectingToStripe(false);
          setErrorMessage(cardErr.message || 'Card payment processing failed. Please check your card details.');
          return;
        }
      }

      navigate(`/order-success/${newOrder.orderNumber}`, { state: { order: newOrder } });
    },
    onError: (err) => {
      setIsRedirectingToStripe(false);
      setErrorMessage(err.message || 'Failed to place order. Please check your information.');
    },
  });

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponError('');
    couponMutation.mutate({
      code: couponCodeInput.trim(),
      cartTotal: cart.subtotal,
    });
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !shippingAddress.recipientName.trim() ||
      !shippingAddress.phone.trim() ||
      !shippingAddress.street.trim() ||
      !shippingAddress.city.trim()
    ) {
      setErrorMessage('Please fill in all required shipping address fields.');
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (paymentMethod === 'STRIPE') {
      if (!cardDetails.cardholderName.trim()) {
        setErrorMessage('Please enter the Cardholder Name on your debit/credit card.');
        return;
      }
      const cleanNum = cardDetails.cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 15) {
        setErrorMessage('Please enter a valid 16-digit Card Number.');
        return;
      }
      if (cardDetails.expiry.length < 5) {
        setErrorMessage('Please enter Card Expiry Date (MM/YY).');
        return;
      }
      if (cardDetails.cvc.length < 3) {
        setErrorMessage('Please enter a valid 3-digit CVC security code.');
        return;
      }
    }

    orderMutation.mutate({
      shippingAddress,
      couponCode: appliedCoupon?.code || null,
      notes: notes.trim() || null,
      paymentMethod,
    });
  };

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const shippingFee = subtotal >= 1000 || subtotal === 0 ? 0 : 150;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  if (isCartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#6a9739] border-t-transparent"></div>
        <p className="mt-3 text-gray-500">Preparing your checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#f8f6f3] min-h-[70vh] flex items-center justify-center py-16">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <ShoppingBag className="w-16 h-16 stroke-1 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
          <p className="text-xs text-gray-500 mt-2">
            You don't have any items to checkout. Please add products from the shop first.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-block px-6 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg transition-colors"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f3] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
            <p className="text-xs text-gray-500 mt-1">
              Signed in as <span className="font-bold text-gray-800">{user?.email}</span>
            </p>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6a9739] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Cart
          </Link>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-sm text-red-700 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Delivery Details & Payment (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Address Section */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <MapPin className="w-5 h-5 text-[#6a9739]" />
                  <h2 className="text-base font-bold text-gray-900">Delivery Address</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sara Khan"
                      value={shippingAddress.recipientName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, recipientName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+92 300 1234567"
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Street Address & House / Flat No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. House 14, Street 7, Block B, Model Town"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, street: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lahore"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Punjab"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 54000"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Pakistan"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Section (COD vs Stripe) */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-[#6a9739]" />
                    <h2 className="text-base font-bold text-gray-900">Payment Method</h2>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#6a9739]" /> 256-Bit Encrypted
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Option 1: Cash on Delivery */}
                  <div
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      paymentMethod === 'COD'
                        ? 'border-[#6a9739] bg-green-50/40 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">Cash on Delivery</span>
                        </div>
                        <span className="text-[10px] text-gray-500 block mt-0.5">Pay at doorstep</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          paymentMethod === 'COD'
                            ? 'border-[#6a9739] bg-[#6a9739]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'COD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Pay in cash when your fresh organic groceries arrive. Confirm receipt with delivery courier.
                    </p>
                  </div>

                  {/* Option 2: Online Payment (Stripe) */}
                  <div
                    onClick={() => setPaymentMethod('STRIPE')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      paymentMethod === 'STRIPE'
                        ? 'border-[#6a9739] bg-green-50/40 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">Online Card (Stripe)</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-extrabold tracking-wider uppercase">
                            Fast
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 block mt-0.5">Debit / Credit Card</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          paymentMethod === 'STRIPE'
                            ? 'border-[#6a9739] bg-[#6a9739]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'STRIPE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Visa, MasterCard & UnionPay. Instant order confirmation with zero cash handling hassle.
                    </p>
                  </div>
                </div>

                {/* Option B: Embedded Card Inputs when STRIPE is selected */}
                {paymentMethod === 'STRIPE' && (
                  <div className="mt-4 p-5 rounded-xl border border-blue-200 bg-linear-to-b from-blue-50/50 to-white space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-blue-100 pb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Debit / Credit Card Details
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={fillTestCard}
                        className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 hover:bg-blue-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        ⚡ Fill Demo Card
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={cardDetails.cardholderName}
                        onChange={(e) =>
                          setCardDetails((prev) => ({ ...prev, cardholderName: e.target.value }))
                        }
                        className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          value={cardDetails.cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full px-3.5 py-2 text-sm font-mono tracking-wider bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] shadow-2xs"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-gray-400 font-semibold pointer-events-none">
                          <span className="text-blue-700 font-black italic">VISA</span>
                          <span className="text-orange-500 font-black">MC</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Expiry Date (MM/YY)
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardDetails.expiry}
                          onChange={handleExpiryChange}
                          className="w-full px-3.5 py-2 text-sm font-mono text-center bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          CVC / Security Code
                        </label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength={4}
                          value={cardDetails.cvc}
                          onChange={handleCvcChange}
                          className="w-full px-3.5 py-2 text-sm font-mono text-center bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] shadow-2xs"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 flex items-center gap-1 pt-1">
                      <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>
                        Direct Card Gateway: Your card credentials are securely processed and verified.
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Notes / Special Instructions */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-[#6a9739]" />
                  <h2 className="text-base font-bold text-gray-900">Order Notes (Optional)</h2>
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. Please leave package at front gate or ring bell twice."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white"
                />
              </div>
            </div>

            {/* Right Column: Order Review Sidebar (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-5">
                <h2 className="text-base font-bold text-gray-900">
                  Order Review ({cart.totalItems} items)
                </h2>

                {/* Items List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 pr-1 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#6a9739]">
                            <Leaf className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-[11px] text-gray-500">
                          {item.quantity} × ₨ {item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-900 shrink-0">
                        ₨ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Accordion / Input */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. ORGANIC25"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="w-full pl-8 pr-2 py-1.5 text-xs font-mono uppercase bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponMutation.isPending || !couponCodeInput.trim()}
                      className="px-3 py-1.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {couponMutation.isPending ? '...' : 'Apply'}
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                  )}

                  {appliedCoupon && (
                    <div className="p-2 bg-green-50 rounded-lg flex items-center justify-between text-xs text-green-800 font-medium">
                      <span>Applied: {appliedCoupon.code}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCodeInput('');
                        }}
                        className="text-red-500 hover:text-red-700 text-[11px] underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals Breakdown */}
                <div className="border-t border-gray-100 pt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">₨ {subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-green-700 font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>- ₨ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-gray-900">
                      {shippingFee === 0 ? (
                        <span className="text-[#6a9739] font-bold">FREE</span>
                      ) : (
                        `₨ ${shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-gray-900">Total Due</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#6a9739]">
                        ₨ {grandTotal.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-gray-400">
                        {paymentMethod === 'STRIPE' ? 'Online card payment via Stripe' : 'Pay on delivery (COD)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirm Order Button */}
                <button
                  type="submit"
                  disabled={orderMutation.isPending || isRedirectingToStripe}
                  className="w-full py-3.5 px-6 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {orderMutation.isPending || isRedirectingToStripe ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>
                        {paymentMethod === 'STRIPE' ? 'Processing Card Payment...' : 'Placing Your Order...'}
                      </span>
                    </>
                  ) : paymentMethod === 'STRIPE' ? (
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Pay with Card (₨ {grandTotal.toFixed(2)})</span>
                    </span>
                  ) : (
                    <span>Confirm & Place Order (COD)</span>
                  )}
                </button>

                {/* Trust strip */}
                <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#6a9739]" />
                    <span>Safe & Verified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#6a9739]" />
                    <span>Farm Fresh Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
