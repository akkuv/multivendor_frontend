import { Routes, Route, Navigate } from 'react-router-dom'
import { StoreLayout } from '@/layouts/StoreLayout'
import { VendorLayout } from '@/layouts/VendorLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AccountLayout } from '@/layouts/AccountLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { HomePage } from '@/features/website/pages/HomePage'
import { ShopPage } from '@/features/website/pages/ShopPage'
import { CategoryPage } from '@/features/website/pages/CategoryPage'
import { CustomPageView } from '@/features/website/pages/CustomPageView'
import { CollectionsPage } from '@/features/website/pages/CollectionsPage'
import { CollectionsIndexPage } from '@/features/website/pages/CollectionsIndexPage'
import { AllCategoriesPage } from '@/features/website/pages/AllCategoriesPage'
import { AllBrandsPage } from '@/features/website/pages/AllBrandsPage'
import { FeaturedProductsPage } from '@/features/website/pages/FeaturedProductsPage'
import { BestSellersPage } from '@/features/website/pages/BestSellersPage'
import { DealsPage } from '@/features/website/pages/DealsPage'
import { ProductPage } from '@/features/website/pages/ProductPage'
import { VendorPage } from '@/features/website/pages/VendorPage'
import { ComparePage } from '@/features/website/pages/ComparePage'
import { CartPage } from '@/features/website/pages/CartPage'
import { WishlistPage } from '@/features/website/pages/WishlistPage'
import { CheckoutPage } from '@/features/website/pages/CheckoutPage'
import { LoginPage } from '@/features/website/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/website/pages/ForgotPasswordPage'
import { RegisterPage } from '@/features/website/pages/RegisterPage'
import { AccountPage } from '@/features/website/pages/AccountPage'
import { WalletPage } from '@/features/website/pages/user/WalletPage'
import { MyOrdersPage } from '@/features/website/pages/user/MyOrdersPage'
import { TrackOrderPage } from '@/features/website/pages/user/TrackOrderPage'
import { MyAddressesPage } from '@/features/website/pages/user/MyAddressesPage'
import { MyReviewsPage } from '@/features/website/pages/user/MyReviewsPage'
import { MyReturnsPage } from '@/features/website/pages/user/MyReturnsPage'
import { MyVendorReviewsPage } from '@/features/website/pages/user/MyVendorReviewsPage'
import { WishlistNotificationsPage } from '@/features/website/pages/user/WishlistNotificationsPage'
import { CustomerSupportPage } from '@/features/website/pages/user/CustomerSupportPage'
import { MyProductQueriesPage } from '@/features/website/pages/user/MyProductQueriesPage'
import { UserNotificationsPage } from '@/features/website/pages/user/UserNotificationsPage'
import { OrderDetailPage } from '@/features/website/pages/OrderDetailPage'
import { VendorDashboardPage } from '@/features/website/pages/vendor/VendorDashboardPage'
import { VendorProductsPage } from '@/features/website/pages/vendor/VendorProductsPage'
import { VendorOrdersPage } from '@/features/website/pages/vendor/VendorOrdersPage'
import { VendorOrderDetailPage } from '@/features/website/pages/vendor/VendorOrderDetailPage'
import { VendorReturnsPage } from '@/features/website/pages/vendor/VendorReturnsPage'
import { VendorShipmentsPage } from '@/features/website/pages/vendor/VendorShipmentsPage'
import { VendorShipmentDetailPage } from '@/features/website/pages/vendor/VendorShipmentDetailPage'
import { VendorWalletPage } from '@/features/website/pages/vendor/VendorWalletPage'
import { VendorPayoutsPage } from '@/features/website/pages/vendor/VendorPayoutsPage'
import { VendorReportsPage } from '@/features/website/pages/vendor/VendorReportsPage'
import { VendorProfilePage } from '@/features/website/pages/vendor/VendorProfilePage'
import { VendorNotificationsPage } from '@/features/website/pages/vendor/VendorNotificationsPage'
import { VendorQuestionsPage } from '@/features/website/pages/vendor/VendorQuestionsPage'
import { VendorSupportPage } from '@/features/website/pages/vendor/VendorSupportPage'
import { VendorOrderQueriesPage } from '@/features/website/pages/vendor/VendorOrderQueriesPage'
import { VendorProductQueriesPage } from '@/features/website/pages/vendor/VendorProductQueriesPage'
import { AdminDashboardPage } from '@/features/website/pages/admin/AdminDashboardPage'
import { AdminVendorsPage } from '@/features/website/pages/admin/AdminVendorsPage'
import { AdminCategoriesPage } from '@/features/website/pages/admin/AdminCategoriesPage'
import { AdminBrandsPage } from '@/features/website/pages/admin/AdminBrandsPage'
import { AdminCollectionsPage } from '@/features/website/pages/admin/AdminCollectionsPage'
import { AdminAttributesPage } from '@/features/website/pages/admin/AdminAttributesPage'
import { AdminColorsPage } from '@/features/website/pages/admin/AdminColorsPage'
import { AdminSizesPage } from '@/features/website/pages/admin/AdminSizesPage'
import { AdminCouponsPage } from '@/features/website/pages/admin/AdminCouponsPage'
import { AdminOrdersPage } from '@/features/website/pages/admin/AdminOrdersPage'
import { AdminVendorOrdersPage } from '@/features/website/pages/admin/AdminVendorOrdersPage'
import { AdminShipmentsPage } from '@/features/website/pages/admin/AdminShipmentsPage'
import { AdminNotificationsPage } from '@/features/website/pages/admin/AdminNotificationsPage'
import { AdminReportsPage } from '@/features/website/pages/admin/AdminReportsPage'
import { AdminProductsPage } from '@/features/website/pages/admin/AdminProductsPage'
import { AdminUsersPage } from '@/features/website/pages/admin/AdminUsersPage'
import { AdminPaymentsPage } from '@/features/website/pages/admin/AdminPaymentsPage'
import { AdminShippingSettingsPage } from '@/features/website/pages/admin/AdminShippingSettingsPage'
import { AdminSupportPage } from '@/features/website/pages/admin/AdminSupportPage'
import { AdminCustomerSupportPage } from '@/features/website/pages/admin/AdminCustomerSupportPage'
import { AdminOrderQueriesPage } from '@/features/website/pages/admin/AdminOrderQueriesPage'
import { AdminProductQueriesPage } from '@/features/website/pages/admin/AdminProductQueriesPage'
import { AdminWalletPage } from '@/features/website/pages/admin/AdminWalletPage'
import { AdminReturnsPage } from '@/features/website/pages/admin/AdminReturnsPage'
import { AdminPayoutsPage } from '@/features/website/pages/admin/AdminPayoutsPage'
import { AdminReviewsPage } from '@/features/website/pages/admin/AdminReviewsPage'
import { AdminVendorReviewsPage } from '@/features/website/pages/admin/AdminVendorReviewsPage'
import { AdminQuestionsPage } from '@/features/website/pages/admin/AdminQuestionsPage'
import { AdminHomeManagerPage } from '@/features/website/pages/admin/AdminHomeManagerPage'
import { AdminCategoryPagesPage } from '@/features/website/pages/admin/AdminCategoryPagesPage'
import { AdminPagesPage } from '@/features/website/pages/admin/AdminPagesPage'
import { AdminPageManagerPage } from '@/features/website/pages/admin/AdminPageManagerPage'
import { AdminBrowseSubcategoriesPage } from '@/features/website/pages/admin/AdminBrowseSubcategoriesPage'
import { AdminWebsiteSettingsPage } from '@/features/website/pages/admin/AdminWebsiteSettingsPage'
import { NotFoundPage } from '@/features/website/pages/NotFoundPage'
import { HelpPage } from '@/features/website/pages/HelpPage'
import { ContactPage } from '@/features/website/pages/ContactPage'

// Determine which "app" this build serves. Set VITE_APP_ROLE=admin|vendor|customer
// per deployment (or rely on the subdomain: admin.* / vendor.*).
function appRole(): 'admin' | 'vendor' | 'customer' | 'all' {
  const envRole = (import.meta.env.VITE_APP_ROLE ?? '').toLowerCase()
  if (envRole === 'admin' || envRole === 'vendor' || envRole === 'customer') {
    return envRole
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    if (host.startsWith('admin.')) return 'admin'
    if (host.startsWith('vendor.')) return 'vendor'
  }
  return 'all'
}

export default function App() {
  const role = appRole()
  const showStore = role === 'all' || role === 'customer'
  const showVendor = role === 'all' || role === 'vendor'
  const showAdmin = role === 'all' || role === 'admin'

  return (
    <Routes>
      {showStore && (
        <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="collections" element={<CollectionsIndexPage />} />
        <Route path="collections/:slug" element={<CollectionsPage />} />
        <Route path="categories" element={<AllCategoriesPage />} />
        <Route path="featured-products" element={<FeaturedProductsPage />} />
        <Route path="best-sellers" element={<BestSellersPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="brands" element={<AllBrandsPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="vendors/:id" element={<VendorPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route
          path="cart"
          element={
            <ProtectedRoute role="CUSTOMER">
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="wishlist"
          element={
            <ProtectedRoute role="CUSTOMER">
              <WishlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <ProtectedRoute role="CUSTOMER">
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route
          path="account"
          element={
            <ProtectedRoute role="CUSTOMER">
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="track" element={<TrackOrderPage />} />
          <Route path="addresses" element={<MyAddressesPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="returns" element={<MyReturnsPage />} />
          <Route path="reviews" element={<MyReviewsPage />} />
          <Route path="vendor-reviews" element={<MyVendorReviewsPage />} />
          <Route path="wishlist-notifications" element={<WishlistNotificationsPage />} />
          <Route path="notifications" element={<UserNotificationsPage />} />
          <Route path="support" element={<CustomerSupportPage />} />
          <Route path="product-queries" element={<MyProductQueriesPage />} />
          <Route path="product-queries/:id" element={<MyProductQueriesPage />} />
        </Route>
        {/* Admin-created pages live at the path the admin chooses (any depth). */}
        <Route path="*" element={<CustomPageView />} />
      </Route>
      )}

      {showVendor && (
      <Route
        path="vendor"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VendorDashboardPage />} />
        <Route path="products" element={<VendorProductsPage />} />
        <Route path="orders" element={<VendorOrdersPage />} />
        <Route path="orders/:id" element={<VendorOrderDetailPage />} />
        <Route path="returns" element={<VendorReturnsPage />} />
        <Route path="shipments" element={<VendorShipmentsPage />} />
        <Route path="shipments/:id" element={<VendorShipmentDetailPage />} />
        <Route path="wallet" element={<VendorWalletPage />} />
        <Route path="payouts" element={<VendorPayoutsPage />} />
        <Route path="reports" element={<VendorReportsPage />} />
        <Route path="profile" element={<VendorProfilePage />} />
        <Route path="notifications" element={<VendorNotificationsPage />} />
        <Route path="questions" element={<VendorQuestionsPage />} />
        <Route path="support" element={<VendorSupportPage />} />
        <Route path="order-queries" element={<VendorOrderQueriesPage />} />
        <Route path="product-queries" element={<VendorProductQueriesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      )}

      {showAdmin && (
      <Route
        path="admin"
        element={
          <ProtectedRoute role="SUPER_ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="homepage" element={<AdminHomeManagerPage />} />
        <Route path="category-pages" element={<AdminCategoryPagesPage />} />
        <Route path="pages" element={<AdminPagesPage />} />
        <Route path="pages/:id" element={<AdminPageManagerPage />} />
        <Route path="browse-subcategories" element={<AdminBrowseSubcategoriesPage />} />
        <Route path="website-settings" element={<AdminWebsiteSettingsPage />} />
        <Route path="vendors" element={<AdminVendorsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="brands" element={<AdminBrandsPage />} />
        <Route path="collections" element={<AdminCollectionsPage />} />
        <Route path="attributes" element={<AdminAttributesPage />} />
        <Route path="colors" element={<AdminColorsPage />} />
        <Route path="sizes" element={<AdminSizesPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
<Route path="products" element={<AdminProductsPage />} />
<Route path="orders"     element={<AdminOrdersPage />} />
  <Route path="vendor-orders" element={<AdminVendorOrdersPage />} />
  <Route path="vendor-orders/:id" element={<AdminVendorOrdersPage />} />
  <Route path="shipments" element={<AdminShipmentsPage />} />
  <Route path="users"      element={<AdminUsersPage />} />
  <Route path="payments"   element={<AdminPaymentsPage />} />
  <Route path="shipping"   element={<AdminShippingSettingsPage />} />
  <Route path="wallet"     element={<AdminWalletPage />} />
  <Route path="payouts"    element={<AdminPayoutsPage />} />
  <Route path="returns"    element={<AdminReturnsPage />} />
  <Route path="reviews"    element={<AdminReviewsPage />} />
  <Route path="vendor-reviews" element={<AdminVendorReviewsPage />} />
  <Route path="questions" element={<AdminQuestionsPage />} />
  <Route path="support" element={<AdminSupportPage />} />
  <Route path="customer-support" element={<AdminCustomerSupportPage />} />
  <Route path="order-queries" element={<AdminOrderQueriesPage />} />
  <Route path="order-queries/:id" element={<AdminOrderQueriesPage />} />
  <Route path="product-queries" element={<AdminProductQueriesPage />} />
  <Route path="product-queries/:id" element={<AdminProductQueriesPage />} />
  <Route path="notifications" element={<AdminNotificationsPage />} />
  <Route path="reports" element={<AdminReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      )}

      {/* Shared auth route, available on every subdomain. */}
      <Route path="login" element={<LoginPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />

      {/* Root redirect for panel subdomains. */}
      {role === 'admin' && <Route index element={<Navigate to="/admin" replace />} />}
      {role === 'vendor' && <Route index element={<Navigate to="/vendor" replace />} />}

    </Routes>
  )
}
