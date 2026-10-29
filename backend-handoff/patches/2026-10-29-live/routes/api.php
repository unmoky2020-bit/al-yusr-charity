<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\UserManagement\UserController;
use App\Http\Controllers\Api\V1\UserManagement\RoleController;
use App\Http\Controllers\Api\V1\UserManagement\PermissionController;

use App\Http\Controllers\Api\V1\Donor\DonorController;
use App\Http\Controllers\Api\V1\Donation\DonationController;
use App\Http\Controllers\Api\V1\Program\ProgramController;
use App\Http\Controllers\Api\V1\Project\ProjectController;
use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use App\Http\Controllers\Api\V1\PaymentMethod\PaymentMethodController;

use App\Http\Controllers\Api\V1\Case\CaseModelController;
use App\Http\Controllers\Api\V1\Case\CaseCategoryController;

use App\Http\Controllers\Api\V1\Volunteer\VolunteerController;
use App\Http\Controllers\Api\V1\VolunteerCampaign\VolunteerCampaignController;
use App\Http\Controllers\Api\V1\ContentApproval\ContentChangeRequestController;
use App\Http\Controllers\Api\V1\AboutUsController;
use App\Http\Controllers\Api\V1\Program\ProgramDonationPackageController;
use App\Http\Controllers\Api\V1\Paymob\PaymobController;
use App\Http\Controllers\Api\V1\Setting\SettingController;
use App\Http\Controllers\Api\V1\Faq\FaqCategoryController;
use App\Http\Controllers\Api\V1\Faq\FaqController;
use App\Http\Controllers\Api\V1\DonationCampaign\DonationCampaignController;
use App\Http\Controllers\Api\V1\DonationCampaign\DonationCampaignCategoryController;
use App\Http\Controllers\Api\V1\Project\ProjectDonationPackageController;
use App\Http\Controllers\Api\V1\DonationCampaign\DonationCampaignDonationPackageController;
use App\Http\Controllers\Api\V1\Notification\NotificationController;
use App\Http\Controllers\Api\V1\ActivityLog\ActivityLogController;
use App\Http\Controllers\Api\V1\Kashier\KashierController;
use App\Http\Controllers\Api\V1\PaymentGateway\PaymentGatewayController;
use App\Http\Controllers\Api\V1\NumbersAchievements\HomeNumberController;
use App\Http\Controllers\Api\V1\NumbersAchievements\AchievementController;
use App\Http\Controllers\Api\V1\BlogSeo\BlogSeoController;
use App\Http\Controllers\Api\V1\HomePage\HomePageContentController;
use App\Http\Controllers\Api\V1\Season\SeasonController;
use App\Http\Controllers\Api\V1\Axis\AxisController;
use App\Http\Controllers\Api\V1\Content\ContentController;
use App\Http\Controllers\Api\V1\Gallery\GalleryImageController;
use App\Http\Controllers\Api\V1\Story\StoryController;
use App\Http\Controllers\Api\V1\Newsletter\NewsletterSubscriberController;
use App\Http\Controllers\Api\V1\Carousel\HomepageCarouselController;
use App\Http\Controllers\Api\V1\Program\ProgramPageSectionController;
use App\Http\Controllers\Api\V1\Media\MediaController;
use App\Http\Controllers\Api\V1\Case\CaseContentController;
use App\Http\Controllers\Api\V1\Push\PushSubscriptionController;
use App\Http\Controllers\Api\V1\Inbox\ContactMessageController;
use App\Http\Controllers\Api\V1\Inbox\KhabiaRequestController;
use App\Http\Controllers\Api\V1\DonationPackageReorderController;
use App\Http\Controllers\Api\V1\VolunteerCampaign\VolunteerApplicationController;
use App\Http\Controllers\Api\V1\Newsletter\NewsletterTokenController;
use App\Http\Controllers\Api\V1\HomePage\HomepageCampaignsSectionController;
use App\Http\Controllers\Api\V1\HomePage\HomepageUrgentCasesController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Security rule:
| - Public GET endpoints stay public.
| - Every protected write endpoint requires auth:sanctum.
| - Every protected write endpoint also requires its exact permission.
| - editor.approval is applied AFTER the permission check.
| - Payment gateway credentials are NOT put through editor.approval.
|
*/

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Public Payment / Donation / Gateway Callbacks
    |--------------------------------------------------------------------------
    */

    Route::get('payment-methods/active', [PaymentMethodController::class, 'publicIndex']);

    Route::post('donations/submit', [DonationController::class, 'store'])
        ->middleware('throttle:20,1');
    Route::get('donations/track/{transactionReference}', [DonationController::class, 'track'])
        ->middleware('throttle:30,1');

    // Service pages (public reads; ?all=1 for staff)
    Route::get('services', [\App\Http\Controllers\Api\V1\Service\ServiceController::class, 'index']);
    Route::get('service-categories', [\App\Http\Controllers\Api\V1\Service\ServiceController::class, 'categories']);
    Route::get('services/{slug}', [\App\Http\Controllers\Api\V1\Service\ServiceController::class, 'show']);

    // SEO / social preview data for one public page (used by elyusr.org/seo.php)
    Route::get('seo/page', \App\Http\Controllers\Api\V1\Seo\SeoPageController::class)
        ->middleware('throttle:240,1');

    Route::post('paymob/callback', [PaymobController::class, 'callback']);

    Route::post('kashier/webhook', [KashierController::class, 'webhook']);
    Route::get('kashier/redirect', [KashierController::class, 'redirect']);

    /*
    |--------------------------------------------------------------------------
    | Public FAQ
    |--------------------------------------------------------------------------
    */

    Route::get('faq-categories', [FaqCategoryController::class, 'index']);
    Route::get('faq-categories/{faqCategory}', [FaqCategoryController::class, 'show']);

    Route::get('faqs', [FaqController::class, 'index']);
    Route::get('faqs/{faq}', [FaqController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Public Donation Campaigns
    |--------------------------------------------------------------------------
    */

    Route::get('donation-campaigns', [DonationCampaignController::class, 'index']);
    Route::get('donation-campaigns/by-slug/{slug}', [DonationCampaignController::class, 'showBySlug']);
    Route::get('donation-campaigns/{donationCampaign}', [DonationCampaignController::class, 'show']);

    Route::get(
        'donation-campaign-categories',
        [DonationCampaignCategoryController::class, 'index']
    );
    Route::get(
        'donation-campaign-categories/{donationCampaignCategory}',
        [DonationCampaignCategoryController::class, 'show']
    );

    /*
    |--------------------------------------------------------------------------
    | Public Programs / Projects / Cases 
    |--------------------------------------------------------------------------
    */

    Route::get('programs', [ProgramController::class, 'index']);
    Route::get('programs/{program}', [ProgramController::class, 'show']);

    Route::get('projects', [ProjectController::class, 'index']);
    Route::get('projects/{project}', [ProjectController::class, 'show']);

    Route::get('cases', [CaseModelController::class, 'index']);
    Route::get('cases/statistics', [CaseModelController::class, 'statistics'])
        ->middleware(['auth:sanctum', 'permission:cases.view']);
    Route::get('cases/{case}', [CaseModelController::class, 'show']);
    Route::get('cases/{case}/updates', [CaseContentController::class, 'updates']);
    Route::get('cases/{case}/media', [CaseContentController::class, 'media']);
    Route::get('cases/{case}/documents', [CaseContentController::class, 'documents']);
    Route::get('cases/{case}/journey', [CaseContentController::class, 'journey']);
    Route::get('push/public-key', [PushSubscriptionController::class, 'publicKey']);

    Route::get('case-categories', [CaseCategoryController::class, 'index']);
    Route::get('case-categories/{caseCategory}', [CaseCategoryController::class, 'show']);



    /*
    |--------------------------------------------------------------------------
    | Public Donation Packages
    |--------------------------------------------------------------------------
    */

    Route::get(
        'programs/{program}/donation-packages',
        [ProgramDonationPackageController::class, 'index']
    );
    Route::get(
        'programs/{program}/donation-packages/{donationPackage}',
        [ProgramDonationPackageController::class, 'show']
    );

    Route::get(
        'projects/{project}/donation-packages',
        [ProjectDonationPackageController::class, 'index']
    );
    Route::get(
        'projects/{project}/donation-packages/{donationPackage}',
        [ProjectDonationPackageController::class, 'show']
    );

    Route::get(
        'donation-campaigns/{donationCampaign}/donation-packages',
        [DonationCampaignDonationPackageController::class, 'index']
    );
    Route::get(
        'donation-campaigns/{donationCampaign}/donation-packages/{donationPackage}',
        [DonationCampaignDonationPackageController::class, 'show']
    );

    /*
    |--------------------------------------------------------------------------
    | Public Volunteer Campaigns
    |--------------------------------------------------------------------------
    */

    Route::get('volunteer-campaigns', [VolunteerCampaignController::class, 'index']);
    Route::get(
        'volunteer-campaigns/statistics',
        [VolunteerCampaignController::class, 'statistics']
    )->middleware(['auth:sanctum', 'permission:volunteer_campaigns.view']);

    Route::get(
        'volunteer-campaigns/{volunteer_campaign}',
        [VolunteerCampaignController::class, 'show']
    );

    /*
    |--------------------------------------------------------------------------
    | Public Content
    |--------------------------------------------------------------------------
    */

    Route::get('content', [ContentController::class, 'index']);
    Route::get('content/{content}', [ContentController::class, 'show']);

    Route::get('gallery', [GalleryImageController::class, 'index']);
    Route::get('gallery/statistics', [GalleryImageController::class, 'statistics'])
        ->middleware(['auth:sanctum', 'permission:gallery.view']);
    Route::get('gallery/{gallery}', [GalleryImageController::class, 'show']);

    Route::get('stories', [StoryController::class, 'index']);
    Route::get('stories/statistics', [StoryController::class, 'statistics'])
        ->middleware(['auth:sanctum', 'permission:stories.view']);
    Route::get('stories/{story}', [StoryController::class, 'show']);

    Route::get('home-numbers', [HomeNumberController::class, 'index']);
    Route::get('home-numbers/statistics', [HomeNumberController::class, 'statistics'])
        ->middleware(['auth:sanctum', 'permission:home_numbers.view']);
    Route::get('home-numbers/{homeNumber}', [HomeNumberController::class, 'show']);

    Route::get('achievements', [AchievementController::class, 'index']);
    Route::get('achievements/statistics', [AchievementController::class, 'statistics'])
        ->middleware(['auth:sanctum', 'permission:achievements.view']);
    Route::get('achievements/{achievement}', [AchievementController::class, 'show']);

    Route::get('blog-seo', [BlogSeoController::class, 'index']);
    Route::get('blog-seo/statistics', [BlogSeoController::class, 'statistics'])
        ->middleware(['auth:sanctum', 'permission:blog_seo.view']);
    Route::get('blog-seo/{blogSeo}', [BlogSeoController::class, 'show']);

    Route::get('homepage-content', [HomePageContentController::class, 'show']);
    Route::get('homepage/hero', [HomePageContentController::class, 'hero']);
    Route::get('homepage/content', [HomePageContentController::class, 'content']);

    /*
    |--------------------------------------------------------------------------
    | Public About Us
    |--------------------------------------------------------------------------
    */

    Route::get('about-us', [AboutUsController::class, 'show']);

    Route::get('about-us/hero', [AboutUsController::class, 'section'])
        ->defaults('section', 'hero');
    Route::get('about-us/stats', [AboutUsController::class, 'section'])
        ->defaults('section', 'stats');
    Route::get('about-us/programs', [AboutUsController::class, 'section'])
        ->defaults('section', 'programs');
    Route::get('about-us/trust', [AboutUsController::class, 'section'])
        ->defaults('section', 'trust');
    Route::get('about-us/why-us', [AboutUsController::class, 'section'])
        ->defaults('section', 'why-us');
    Route::get('about-us/values', [AboutUsController::class, 'section'])
        ->defaults('section', 'values');
    Route::get('about-us/story', [AboutUsController::class, 'section'])
        ->defaults('section', 'story');
    Route::get('about-us/vision-2030', [AboutUsController::class, 'section'])
        ->defaults('section', 'vision-2030');


        /*
|--------------------------------------------------------------------------
| Public Axes
|--------------------------------------------------------------------------
*/

Route::get('axes', [AxisController::class, 'publicIndex']);
Route::get('axes/{slug}', [AxisController::class, 'publicShow']);

        /*
|--------------------------------------------------------------------------
| Public program section
|--------------------------------------------------------------------------
*/
Route::get('programs/{program}/page-sections', [
    \App\Http\Controllers\Api\V1\Program\ProgramPageSectionController::class,
    'index',
]);

    /*
    |--------------------------------------------------------------------------
    | Public Homepage Carousel
    |--------------------------------------------------------------------------
    */

    Route::get('homepage/carousel', [HomepageCarouselController::class, 'publicIndex']);
    Route::get('homepage/campaigns-section', [HomepageCampaignsSectionController::class, 'show']);
    Route::get('homepage/urgent-cases', [HomepageUrgentCasesController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::post('register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1');
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1');

    /*
    |--------------------------------------------------------------------------
    | Seasons (public read; staff tokens still see inactive seasons)
    |--------------------------------------------------------------------------
    */

    Route::get('seasons', [SeasonController::class, 'index']);
    Route::get('seasons/{season}', [SeasonController::class, 'show']);

    // Public forms: «تواصل معنا» and «الخبيئة»
    Route::post('contact-messages', [ContactMessageController::class, 'store'])
        ->middleware('throttle:5,1');
    Route::post('khabia-requests', [KhabiaRequestController::class, 'store'])
        ->middleware('throttle:5,1');

    Route::post('volunteer-campaigns/{volunteerCampaign}/apply', [VolunteerApplicationController::class, 'apply'])
        ->middleware('throttle:5,1');

    // Newsletter email links (secret token only).
    Route::post('newsletter/confirm', [NewsletterTokenController::class, 'confirm'])
        ->middleware('throttle:20,1');
    Route::post('newsletter/unsubscribe', [NewsletterTokenController::class, 'unsubscribe'])
        ->middleware('throttle:20,1');



    /*
    |--------------------------------------------------------------------------
    |
    |
    | Protected Routes
    |
    |
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Authentication / Profile
        |--------------------------------------------------------------------------
        */

        Route::get('profile', [AuthController::class, 'profile']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('change-password', [AuthController::class, 'changePassword']);

        /*
        |--------------------------------------------------------------------------
        | Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get('dashboard', [DashboardController::class, 'index'])
            ->middleware('permission:dashboard.view');

        /*
        |--------------------------------------------------------------------------
        | Settings
        |--------------------------------------------------------------------------
        */

        Route::get('settings', [SettingController::class, 'index'])
            ->middleware('permission:settings.view');
        Route::post('settings', [SettingController::class, 'store'])
            ->middleware(['permission:settings.create', 'editor.approval']);
        Route::get('settings/{setting}', [SettingController::class, 'show'])
            ->middleware('permission:settings.view');
        Route::put('settings/{setting}', [SettingController::class, 'update'])
            ->middleware(['permission:settings.update', 'editor.approval']);
        Route::patch('settings/{setting}', [SettingController::class, 'update'])
            ->middleware(['permission:settings.update', 'editor.approval']);
        Route::delete('settings/{setting}', [SettingController::class, 'destroy'])
            ->middleware(['permission:settings.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | FAQ Management
        |--------------------------------------------------------------------------
        */

        Route::post('faq-categories', [FaqCategoryController::class, 'store'])
            ->middleware(['permission:faq_categories.create', 'editor.approval']);
        Route::put('faq-categories/{faqCategory}', [FaqCategoryController::class, 'update'])
            ->middleware(['permission:faq_categories.update', 'editor.approval']);
        Route::patch('faq-categories/{faqCategory}', [FaqCategoryController::class, 'update'])
            ->middleware(['permission:faq_categories.update', 'editor.approval']);
        Route::delete('faq-categories/{faqCategory}', [FaqCategoryController::class, 'destroy'])
            ->middleware(['permission:faq_categories.delete', 'editor.approval']);

        Route::post('faqs', [FaqController::class, 'store'])
            ->middleware(['permission:faqs.create', 'editor.approval']);
        Route::put('faqs/{faq}', [FaqController::class, 'update'])
            ->middleware(['permission:faqs.update', 'editor.approval']);
        Route::patch('faqs/{faq}', [FaqController::class, 'update'])
            ->middleware(['permission:faqs.update', 'editor.approval']);
        Route::delete('faqs/{faq}', [FaqController::class, 'destroy'])
            ->middleware(['permission:faqs.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Donation Campaigns
        |--------------------------------------------------------------------------
        */

        Route::post('donation-campaigns', [DonationCampaignController::class, 'store'])
            ->middleware(['permission:donation_campaigns.create', 'editor.approval']);
        Route::put('donation-campaigns/{donationCampaign}', [DonationCampaignController::class, 'update'])
            ->middleware(['permission:donation_campaigns.update', 'editor.approval']);
        Route::patch('donation-campaigns/{donationCampaign}', [DonationCampaignController::class, 'update'])
            ->middleware(['permission:donation_campaigns.update', 'editor.approval']);
        Route::delete('donation-campaigns/{donationCampaign}', [DonationCampaignController::class, 'destroy'])
            ->middleware(['permission:donation_campaigns.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Donation Campaign Categories
        |--------------------------------------------------------------------------
        */

        Route::post('donation-campaign-categories', [DonationCampaignCategoryController::class, 'store'])
            ->middleware(['permission:donation_campaign_categories.create', 'editor.approval']);
        Route::put('donation-campaign-categories/{donationCampaignCategory}', [DonationCampaignCategoryController::class, 'update'])
            ->middleware(['permission:donation_campaign_categories.update', 'editor.approval']);
        Route::patch('donation-campaign-categories/{donationCampaignCategory}', [DonationCampaignCategoryController::class, 'update'])
            ->middleware(['permission:donation_campaign_categories.update', 'editor.approval']);
        Route::delete('donation-campaign-categories/{donationCampaignCategory}', [DonationCampaignCategoryController::class, 'destroy'])
            ->middleware(['permission:donation_campaign_categories.delete', 'editor.approval']);


        /*
        |--------------------------------------------------------------------------
        | Cases & Categories
        |--------------------------------------------------------------------------
        */

        Route::post('cases', [CaseModelController::class, 'store'])
            ->middleware(['permission:cases.create', 'editor.approval']);
        Route::put('cases/{case}', [CaseModelController::class, 'update'])
            ->middleware(['permission:cases.update', 'editor.approval']);
        Route::patch('cases/{case}', [CaseModelController::class, 'update'])
            ->middleware(['permission:cases.update', 'editor.approval']);
        Route::delete('cases/{case}', [CaseModelController::class, 'destroy'])
            ->middleware(['permission:cases.delete', 'editor.approval']);

        Route::post('case-categories', [CaseCategoryController::class, 'store'])
            ->middleware(['permission:case_categories.create', 'editor.approval']);
        Route::put('case-categories/{caseCategory}', [CaseCategoryController::class, 'update'])
            ->middleware(['permission:case_categories.update', 'editor.approval']);
        Route::patch('case-categories/{caseCategory}', [CaseCategoryController::class, 'update'])
            ->middleware(['permission:case_categories.update', 'editor.approval']);
        Route::delete('case-categories/{caseCategory}', [CaseCategoryController::class, 'destroy'])
            ->middleware(['permission:case_categories.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Programs
        |--------------------------------------------------------------------------
        */

        Route::post('programs', [ProgramController::class, 'store'])
            ->middleware(['permission:programs.create', 'editor.approval']);
        Route::put('programs/{program}', [ProgramController::class, 'update'])
            ->middleware(['permission:programs.update', 'editor.approval']);
        Route::patch('programs/{program}', [ProgramController::class, 'update'])
            ->middleware(['permission:programs.update', 'editor.approval']);
        Route::delete('programs/{program}', [ProgramController::class, 'destroy'])
            ->middleware(['permission:programs.delete', 'editor.approval']);
        
        /*
        |--------------------------------------------------------------------------
        | Programs section
        |--------------------------------------------------------------------------
        */

Route::post('programs/{program}/page-sections', [
    ProgramPageSectionController::class, 'store'
])->middleware([
    'permission:programs.update',
    'editor.approval',
]);

Route::put('programs/{program}/page-sections/{section}', [
    ProgramPageSectionController::class, 'update'
])->middleware([
    'permission:programs.update',
    'editor.approval',
]);

Route::put('programs/{program}/top-section', [
    ProgramController::class, 'updateTopSection'
])->middleware([
    'permission:programs.update',
    'editor.approval',
]);

Route::patch('programs/{program}/page-sections/{section}', [ProgramPageSectionController::class, 'update'])
    ->middleware(['permission:programs.update', 'editor.approval']);

Route::delete('programs/{program}/page-sections/{section}', [
    ProgramPageSectionController::class, 'destroy'
])->middleware([
    'permission:programs.update',
    'editor.approval',
]);

Route::patch(
    'programs/{program}/page-sections/{section}/toggle',
    [ProgramPageSectionController::class, 'toggle']
)->middleware(['permission:programs.update', 'editor.approval']);
        /*
        |--------------------------------------------------------------------------
        | Program Donation Packages
        |--------------------------------------------------------------------------
        */

        Route::post('programs/{program}/donation-packages', [ProgramDonationPackageController::class, 'store'])
            ->middleware(['permission:donation_packages.create', 'editor.approval']);
        Route::post('programs/{program}/donation-packages/reorder', [DonationPackageReorderController::class, 'program'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::put('programs/{program}/donation-packages/{donationPackage}', [ProgramDonationPackageController::class, 'update'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::patch('programs/{program}/donation-packages/{donationPackage}', [ProgramDonationPackageController::class, 'update'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::delete('programs/{program}/donation-packages/{donationPackage}', [ProgramDonationPackageController::class, 'destroy'])
            ->middleware(['permission:donation_packages.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Projects
        |--------------------------------------------------------------------------
        */

        Route::post('projects', [ProjectController::class, 'store'])
            ->middleware(['permission:projects.create', 'editor.approval']);
        Route::put('projects/{project}', [ProjectController::class, 'update'])
            ->middleware(['permission:projects.update', 'editor.approval']);
        Route::patch('projects/{project}', [ProjectController::class, 'update'])
            ->middleware(['permission:projects.update', 'editor.approval']);
        Route::delete('projects/{project}', [ProjectController::class, 'destroy'])
            ->middleware(['permission:projects.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Project Donation Packages
        |--------------------------------------------------------------------------
        */

        Route::post('projects/{project}/donation-packages', [ProjectDonationPackageController::class, 'store'])
            ->middleware(['permission:donation_packages.create', 'editor.approval']);
        Route::post('projects/{project}/donation-packages/reorder', [DonationPackageReorderController::class, 'project'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::put('projects/{project}/donation-packages/{donationPackage}', [ProjectDonationPackageController::class, 'update'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::patch('projects/{project}/donation-packages/{donationPackage}', [ProjectDonationPackageController::class, 'update'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::delete('projects/{project}/donation-packages/{donationPackage}', [ProjectDonationPackageController::class, 'destroy'])
            ->middleware(['permission:donation_packages.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Donation Campaign Donation Packages
        |--------------------------------------------------------------------------
        */

        Route::post('donation-campaigns/{donationCampaign}/donation-packages', [DonationCampaignDonationPackageController::class, 'store'])
            ->middleware(['permission:donation_packages.create', 'editor.approval']);
        Route::post('donation-campaigns/{donationCampaign}/donation-packages/reorder', [DonationPackageReorderController::class, 'donationCampaign'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::put('donation-campaigns/{donationCampaign}/donation-packages/{donationPackage}', [DonationCampaignDonationPackageController::class, 'update'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::patch('donation-campaigns/{donationCampaign}/donation-packages/{donationPackage}', [DonationCampaignDonationPackageController::class, 'update'])
            ->middleware(['permission:donation_packages.update', 'editor.approval']);
        Route::delete('donation-campaigns/{donationCampaign}/donation-packages/{donationPackage}', [DonationCampaignDonationPackageController::class, 'destroy'])
            ->middleware(['permission:donation_packages.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | User Management
        |--------------------------------------------------------------------------
        */

        Route::get('users', [UserController::class, 'index'])
            ->middleware('permission:users.view');
        Route::post('users', [UserController::class, 'store'])
            ->middleware('permission:users.create');
        Route::get('users/{user}', [UserController::class, 'show'])
            ->middleware('permission:users.view');
        Route::put('users/{user}', [UserController::class, 'update'])
            ->middleware('permission:users.update');
        Route::patch('users/{user}', [UserController::class, 'update'])
            ->middleware('permission:users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])
            ->middleware('permission:users.delete');

        Route::post('users/super-admin', [UserController::class, 'createSuperAdmin'])
            ->middleware('permission:users.create');

        /*
        |--------------------------------------------------------------------------
        | Roles
        |--------------------------------------------------------------------------
        */

        Route::get('roles', [RoleController::class, 'index'])
            ->middleware('permission:roles.view');
        Route::post('roles', [RoleController::class, 'store'])
            ->middleware('permission:roles.create');
        Route::get('roles/{role}', [RoleController::class, 'show'])
            ->middleware('permission:roles.view');
        Route::put('roles/{role}', [RoleController::class, 'update'])
            ->middleware('permission:roles.update');
        Route::patch('roles/{role}', [RoleController::class, 'update'])
            ->middleware('permission:roles.update');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])
            ->middleware('permission:roles.delete');

        /*
        |--------------------------------------------------------------------------
        | Permissions
        |--------------------------------------------------------------------------
        */

        Route::get('permissions', [PermissionController::class, 'index'])
            ->middleware('permission:permissions.view');
        Route::post('permissions', [PermissionController::class, 'store'])
            ->middleware('permission:permissions.create');
        Route::get('permissions/{permission}', [PermissionController::class, 'show'])
            ->middleware('permission:permissions.view');
        Route::put('permissions/{permission}', [PermissionController::class, 'update'])
            ->middleware('permission:permissions.update');
        Route::patch('permissions/{permission}', [PermissionController::class, 'update'])
            ->middleware('permission:permissions.update');
        Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])
            ->middleware('permission:permissions.delete');

        /*
        |--------------------------------------------------------------------------
        | Donors
        |--------------------------------------------------------------------------
        */

        Route::get('donors', [DonorController::class, 'index'])
            ->middleware('permission:donors.view');
        Route::post('donors', [DonorController::class, 'store'])
            ->middleware(['permission:donors.create', 'editor.approval']);
        Route::get('donors/{donor}', [DonorController::class, 'show'])
            ->middleware('permission:donors.view');
        Route::put('donors/{donor}', [DonorController::class, 'update'])
            ->middleware(['permission:donors.update', 'editor.approval']);
        Route::patch('donors/{donor}', [DonorController::class, 'update'])
            ->middleware(['permission:donors.update', 'editor.approval']);
        Route::delete('donors/{donor}', [DonorController::class, 'destroy'])
            ->middleware(['permission:donors.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Donations
        |--------------------------------------------------------------------------
        */

        Route::get('donations', [DonationController::class, 'index'])
            ->middleware('permission:donations.view');
        Route::get('donations/stats', \App\Http\Controllers\Api\V1\Donation\DonationStatsController::class)
            ->middleware('permission:donations.view');
        Route::post('donations', [DonationController::class, 'store'])
            ->middleware('permission:donations.create');
        Route::get('donations/{donation}', [DonationController::class, 'show'])
            ->middleware('permission:donations.view');
        // Status changes by the team (allowed transitions only, logged) — PUT ignores status.
        Route::patch('donations/{donation}/status', \App\Http\Controllers\Api\V1\Donation\DonationStatusController::class)
            ->middleware('permission:donations.update');
        Route::put('donations/{donation}', [DonationController::class, 'update'])
            ->middleware('permission:donations.update');
        Route::patch('donations/{donation}', [DonationController::class, 'update'])
            ->middleware('permission:donations.update');
        Route::delete('donations/{donation}', [DonationController::class, 'destroy'])
            ->middleware('permission:donations.delete');

        // Service pages (staff writes)
        Route::post('services/reorder', [\App\Http\Controllers\Api\V1\Service\ServiceController::class, 'reorder'])
            ->middleware('permission:content.update');
        Route::post('services', [\App\Http\Controllers\Api\V1\Service\ServiceController::class, 'store'])
            ->middleware('permission:content.create');
        Route::put('services/{slug}', [\App\Http\Controllers\Api\V1\Service\ServiceController::class, 'update'])
            ->middleware('permission:content.update');
        Route::delete('services/{slug}', [\App\Http\Controllers\Api\V1\Service\ServiceController::class, 'destroy'])
            ->middleware('permission:content.delete');

        // Online payment attempts = gateway donations (no separate table)
        Route::get('payment-transactions', [\App\Http\Controllers\Api\V1\Donation\PaymentTransactionController::class, 'index'])
            ->middleware('permission:donations.view');
        Route::patch('payment-transactions/{donation}', [\App\Http\Controllers\Api\V1\Donation\PaymentTransactionController::class, 'update'])
            ->middleware('permission:donations.update');
        Route::post('payment-transactions/{donation}/retry', [\App\Http\Controllers\Api\V1\Donation\PaymentTransactionController::class, 'retry'])
            ->middleware('permission:donations.update');

        /*
        |--------------------------------------------------------------------------
        | Payment Methods
        |--------------------------------------------------------------------------
        */

        Route::get('payment-methods', [PaymentMethodController::class, 'index'])
            ->middleware('permission:payment_methods.view');
        Route::post('payment-methods', [PaymentMethodController::class, 'store'])
            ->middleware(['permission:payment_methods.create', 'editor.approval']);
        Route::get('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'show'])
            ->middleware('permission:payment_methods.view');
        Route::put('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update'])
            ->middleware(['permission:payment_methods.update', 'editor.approval']);
        Route::patch('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update'])
            ->middleware(['permission:payment_methods.update', 'editor.approval']);
        Route::delete('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy'])
            ->middleware(['permission:payment_methods.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Payment Gateways
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | Gateway credentials are secrets. Do NOT send them through editor.approval,
        | because approval payloads are persisted. Permission is sufficient here.
        |
        */

        Route::get('payment-gateways', [PaymentGatewayController::class, 'index'])
            ->middleware('permission:payment_methods.view');

        Route::get('payment-gateways/{gateway}', [PaymentGatewayController::class, 'show'])
            ->middleware('permission:payment_methods.view');

        Route::put('payment-gateways/{gateway}', [PaymentGatewayController::class, 'update'])
            ->middleware('permission:payment_methods.update');

        Route::patch('payment-gateways/{gateway}', [PaymentGatewayController::class, 'update'])
            ->middleware('permission:payment_methods.update');

        Route::patch('payment-gateways/{gateway}/toggle', [PaymentGatewayController::class, 'toggle'])
            ->middleware('permission:payment_methods.update');

        Route::post('payment-gateways/{gateway}/test', [PaymentGatewayController::class, 'testConnection'])
            ->middleware('permission:payment_methods.view');

        /*
        |--------------------------------------------------------------------------
        | Activity Logs / Reports
        |--------------------------------------------------------------------------
        */

        Route::get('activity-logs/statistics', [ActivityLogController::class, 'statistics'])
            ->middleware('permission:reports.view');

        Route::get('activity-logs', [ActivityLogController::class, 'index'])
            ->middleware('permission:reports.view');

        /*
        |--------------------------------------------------------------------------
        | Volunteers
        |--------------------------------------------------------------------------
        */

        Route::get('volunteers/statistics', [VolunteerController::class, 'statistics'])
            ->middleware('permission:volunteers.view');

        Route::get('volunteers', [VolunteerController::class, 'index'])
            ->middleware('permission:volunteers.view');

        Route::post('volunteers', [VolunteerController::class, 'store'])
            ->middleware(['permission:volunteers.create', 'editor.approval']);

        Route::get('volunteers/{volunteer}', [VolunteerController::class, 'show'])
            ->middleware('permission:volunteers.view');

        Route::put('volunteers/{volunteer}', [VolunteerController::class, 'update'])
            ->middleware(['permission:volunteers.update', 'editor.approval']);

        Route::patch('volunteers/{volunteer}', [VolunteerController::class, 'update'])
            ->middleware(['permission:volunteers.update', 'editor.approval']);

        Route::delete('volunteers/{volunteer}', [VolunteerController::class, 'destroy'])
            ->middleware(['permission:volunteers.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Volunteer Campaigns
        |--------------------------------------------------------------------------
        */

        Route::get(
            'volunteer-campaigns/{volunteer_campaign}/applications',
            [VolunteerCampaignController::class, 'applications']
        )->middleware('permission:volunteer_applications.view');

        Route::post(
            'volunteer-campaigns/{volunteer_campaign}/invite',
            [VolunteerCampaignController::class, 'invite']
        )->middleware([
            'permission:volunteer_applications.create',
            'editor.approval',
        ]);

        Route::put(
            'volunteer-campaigns/{volunteer_campaign}/applications/{application}',
            [VolunteerCampaignController::class, 'updateApplication']
        )->middleware([
            'permission:volunteer_applications.update',
            'editor.approval',
        ]);

        Route::delete(
            'volunteer-campaigns/{volunteer_campaign}/applications/{application}',
            [VolunteerCampaignController::class, 'removeApplication']
        )->middleware([
            'permission:volunteer_applications.delete',
            'editor.approval',
        ]);

        Route::post('volunteer-campaigns', [VolunteerCampaignController::class, 'store'])
            ->middleware(['permission:volunteer_campaigns.create', 'editor.approval']);

        Route::put('volunteer-campaigns/{volunteer_campaign}', [VolunteerCampaignController::class, 'update'])
            ->middleware(['permission:volunteer_campaigns.update', 'editor.approval']);

        Route::patch('volunteer-campaigns/{volunteer_campaign}', [VolunteerCampaignController::class, 'update'])
            ->middleware(['permission:volunteer_campaigns.update', 'editor.approval']);

        Route::delete('volunteer-campaigns/{volunteer_campaign}', [VolunteerCampaignController::class, 'destroy'])
            ->middleware(['permission:volunteer_campaigns.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Notifications
        |--------------------------------------------------------------------------
        */

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/read', [NotificationController::class, 'destroyRead']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
        Route::post('push/subscriptions', [PushSubscriptionController::class, 'store']);
        Route::delete('push/subscriptions', [PushSubscriptionController::class, 'destroy']);

        /*
        |--------------------------------------------------------------------------
        | Case updates / media / documents (staff)
        |--------------------------------------------------------------------------
        */

        Route::middleware('permission:cases.update')->group(function () {
            Route::post('cases/{case}/updates', [CaseContentController::class, 'storeUpdate']);
            Route::match(['put', 'patch'], 'case-updates/{caseUpdate}', [CaseContentController::class, 'updateUpdate']);
            Route::delete('case-updates/{caseUpdate}', [CaseContentController::class, 'destroyUpdate']);
            Route::post('cases/{case}/media', [CaseContentController::class, 'storeMedia']);
            Route::post('cases/{case}/media/upload', [CaseContentController::class, 'upload']);
            Route::post('cases/{case}/media/reorder', [CaseContentController::class, 'reorderMedia']);
            Route::match(['put', 'patch'], 'case-media/{caseMedia}', [CaseContentController::class, 'updateMedia']);
            Route::delete('case-media/{caseMedia}', [CaseContentController::class, 'destroyMedia']);
            Route::post('cases/{case}/documents', [CaseContentController::class, 'storeDocument']);
            Route::delete('case-documents/{caseDocument}', [CaseContentController::class, 'destroyDocument']);
        });

        /*
        |--------------------------------------------------------------------------
        | Content Change Requests
        |--------------------------------------------------------------------------
        */

        Route::get('content-change-requests', [ContentChangeRequestController::class, 'index'])
            ->middleware('permission:content_change_requests.view');

        Route::get('content-change-requests/{contentChangeRequest}', [ContentChangeRequestController::class, 'show'])
            ->middleware('permission:content_change_requests.view');

        Route::post('content-change-requests/{contentChangeRequest}/approve', [ContentChangeRequestController::class, 'approve'])
            ->middleware('permission:content_change_requests.approve');

        Route::post('content-change-requests/{contentChangeRequest}/reject', [ContentChangeRequestController::class, 'reject'])
            ->middleware('permission:content_change_requests.reject');

        /*
        |--------------------------------------------------------------------------
        | Content Management
        |--------------------------------------------------------------------------
        */

        Route::get('content/statistics', [ContentController::class, 'statistics'])
            ->middleware('permission:content.view');

        Route::post('content', [ContentController::class, 'store'])
            ->middleware(['permission:content.create', 'editor.approval']);
        Route::put('content/{content}', [ContentController::class, 'update'])
            ->middleware(['permission:content.update', 'editor.approval']);
        Route::patch('content/{content}', [ContentController::class, 'update'])
            ->middleware(['permission:content.update', 'editor.approval']);
        Route::delete('content/{content}', [ContentController::class, 'destroy'])
            ->middleware(['permission:content.delete', 'editor.approval']);

        Route::get('admin/content/statistics', [ContentController::class, 'statistics'])
            ->middleware('permission:content.view');
        Route::get('admin/content', [ContentController::class, 'index'])
            ->middleware('permission:content.view');
        Route::post('admin/content', [ContentController::class, 'store'])
            ->middleware(['permission:content.create', 'editor.approval']);
        Route::get('admin/content/{content}', [ContentController::class, 'show'])
            ->middleware('permission:content.view');
        Route::put('admin/content/{content}', [ContentController::class, 'update'])
            ->middleware(['permission:content.update', 'editor.approval']);
        Route::patch('admin/content/{content}', [ContentController::class, 'update'])
            ->middleware(['permission:content.update', 'editor.approval']);
        Route::delete('admin/content/{content}', [ContentController::class, 'destroy'])
            ->middleware(['permission:content.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Gallery
        |--------------------------------------------------------------------------
        */

        Route::post('gallery', [GalleryImageController::class, 'store'])
            ->middleware('permission:gallery.create');
        Route::put('gallery/{gallery}', [GalleryImageController::class, 'update'])
            ->middleware('permission:gallery.update');
        Route::patch('gallery/{gallery}', [GalleryImageController::class, 'update'])
            ->middleware('permission:gallery.update');
        Route::delete('gallery/{gallery}', [GalleryImageController::class, 'destroy'])
            ->middleware('permission:gallery.delete');

        /*
        |--------------------------------------------------------------------------
        | Stories
        |--------------------------------------------------------------------------
        */

        Route::post('stories', [StoryController::class, 'store'])
            ->middleware(['permission:stories.create', 'editor.approval']);
        Route::put('stories/{story}', [StoryController::class, 'update'])
            ->middleware(['permission:stories.update', 'editor.approval']);
        Route::patch('stories/{story}', [StoryController::class, 'update'])
            ->middleware(['permission:stories.update', 'editor.approval']);
        Route::delete('stories/{story}', [StoryController::class, 'destroy'])
            ->middleware(['permission:stories.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Numbers & Achievements
        |--------------------------------------------------------------------------
        */


        Route::post('home-numbers', [HomeNumberController::class, 'store'])
            ->middleware(['permission:home_numbers.create', 'editor.approval']);
        Route::put('home-numbers/{homeNumber}', [HomeNumberController::class, 'update'])
            ->middleware(['permission:home_numbers.update', 'editor.approval']);
        Route::patch('home-numbers/{homeNumber}', [HomeNumberController::class, 'update'])
            ->middleware(['permission:home_numbers.update', 'editor.approval']);
        Route::delete('home-numbers/{homeNumber}', [HomeNumberController::class, 'destroy'])
            ->middleware(['permission:home_numbers.delete', 'editor.approval']);


        Route::post('achievements', [AchievementController::class, 'store'])
            ->middleware(['permission:achievements.create', 'editor.approval']);
        Route::put('achievements/{achievement}', [AchievementController::class, 'update'])
            ->middleware(['permission:achievements.update', 'editor.approval']);
        Route::patch('achievements/{achievement}', [AchievementController::class, 'update'])
            ->middleware(['permission:achievements.update', 'editor.approval']);
        Route::delete('achievements/{achievement}', [AchievementController::class, 'destroy'])
            ->middleware(['permission:achievements.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Blog SEO
        |--------------------------------------------------------------------------
        */

        Route::post('blog-seo', [BlogSeoController::class, 'store'])
            ->middleware(['permission:blog_seo.create', 'editor.approval']);
        Route::put('blog-seo/{blogSeo}', [BlogSeoController::class, 'update'])
            ->middleware(['permission:blog_seo.update', 'editor.approval']);
        Route::patch('blog-seo/{blogSeo}', [BlogSeoController::class, 'update'])
            ->middleware(['permission:blog_seo.update', 'editor.approval']);
        Route::delete('blog-seo/{blogSeo}', [BlogSeoController::class, 'destroy'])
            ->middleware(['permission:blog_seo.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Media library (files on the public disk under media/{collection})
        | Uploads are files, not content changes, so no editor.approval here.
        |--------------------------------------------------------------------------
        */

        Route::get('media', [MediaController::class, 'index'])
            ->middleware('permission:media.view');
        Route::post('media', [MediaController::class, 'store'])
            ->middleware('permission:media.upload');
        Route::post('upload', [MediaController::class, 'store'])
            ->middleware('permission:media.upload');
        Route::delete('media', [MediaController::class, 'destroy'])
            ->middleware('permission:media.delete');

        /*
        |--------------------------------------------------------------------------
        | Inbox: contact messages + khabia requests
        |--------------------------------------------------------------------------
        */

        Route::get('contact-messages', [ContactMessageController::class, 'index'])
            ->middleware('permission:contact_messages.view');
        Route::get('contact-messages/{contactMessage}', [ContactMessageController::class, 'show'])
            ->middleware('permission:contact_messages.view');
        Route::match(['put', 'patch'], 'contact-messages/{contactMessage}', [ContactMessageController::class, 'update'])
            ->middleware('permission:contact_messages.update');
        Route::delete('contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy'])
            ->middleware('permission:contact_messages.delete');

        Route::get('khabia-requests', [KhabiaRequestController::class, 'index'])
            ->middleware('permission:khabia_requests.view');
        Route::get('khabia-requests/{khabiaRequest}', [KhabiaRequestController::class, 'show'])
            ->middleware('permission:khabia_requests.view');
        Route::match(['put', 'patch'], 'khabia-requests/{khabiaRequest}', [KhabiaRequestController::class, 'update'])
            ->middleware('permission:khabia_requests.update');
        Route::post('khabia-requests/{khabiaRequest}/proof', [KhabiaRequestController::class, 'proof'])
            ->middleware('permission:khabia_requests.update');
        Route::delete('khabia-requests/{khabiaRequest}', [KhabiaRequestController::class, 'destroy'])
            ->middleware('permission:khabia_requests.delete');

        /*
        |--------------------------------------------------------------------------
        | Volunteer applications (own list for volunteers, everything for staff)
        |--------------------------------------------------------------------------
        */

        Route::get('volunteer-applications', [VolunteerApplicationController::class, 'index']);
        Route::match(['put', 'patch'], 'volunteer-applications/{application}', [VolunteerApplicationController::class, 'update']);
        Route::delete('volunteer-applications/{application}', [VolunteerApplicationController::class, 'destroy']);

        /*
        |--------------------------------------------------------------------------
        | Newsletter
        |--------------------------------------------------------------------------
        */

        Route::get('newsletter/statistics', [NewsletterSubscriberController::class, 'statistics'])
            ->middleware('permission:newsletter.view');

        Route::get('newsletter', [NewsletterSubscriberController::class, 'index'])
            ->middleware('permission:newsletter.view');
        Route::post('newsletter', [NewsletterSubscriberController::class, 'store'])
            ->middleware(['permission:newsletter.create', 'editor.approval']);
        Route::get('newsletter/{newsletter_subscriber}', [NewsletterSubscriberController::class, 'show'])
            ->middleware('permission:newsletter.view');
        Route::put('newsletter/{newsletter_subscriber}', [NewsletterSubscriberController::class, 'update'])
            ->middleware(['permission:newsletter.update', 'editor.approval']);
        Route::patch('newsletter/{newsletter_subscriber}', [NewsletterSubscriberController::class, 'update'])
            ->middleware(['permission:newsletter.update', 'editor.approval']);
        Route::delete('newsletter/{newsletter_subscriber}', [NewsletterSubscriberController::class, 'destroy'])
            ->middleware(['permission:newsletter.delete', 'editor.approval']);

        // Newsletter campaigns (compose → test → send to confirmed subscribers)
        Route::get('newsletter-campaigns', [\App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::class, 'index'])
            ->middleware('permission:newsletter.view');
        Route::post('newsletter-campaigns', [\App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::class, 'store'])
            ->middleware('permission:newsletter.create');
        Route::get('newsletter-campaigns/{newsletterCampaign}', [\App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::class, 'show'])
            ->middleware('permission:newsletter.view');
        Route::put('newsletter-campaigns/{newsletterCampaign}', [\App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::class, 'update'])
            ->middleware('permission:newsletter.update');
        Route::delete('newsletter-campaigns/{newsletterCampaign}', [\App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::class, 'destroy'])
            ->middleware('permission:newsletter.delete');
        Route::post('newsletter-campaigns/{newsletterCampaign}/send-test', [\App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::class, 'sendTest'])
            ->middleware(['permission:newsletter.update', 'throttle:10,1']);
        Route::post('newsletter-campaigns/{newsletterCampaign}/send', [\App\Http\Controllers\Api\V1\Newsletter\NewsletterCampaignController::class, 'send'])
            ->middleware(['permission:newsletter.update', 'throttle:3,1']);

        /*
        |--------------------------------------------------------------------------
        | Homepage
        |--------------------------------------------------------------------------
        */

        Route::put('homepage-content', [HomePageContentController::class, 'update'])
            ->middleware(['permission:homepage.update', 'editor.approval']);
        Route::put('homepage/campaigns-section', [HomepageCampaignsSectionController::class, 'update'])
            ->middleware(['permission:homepage.update', 'editor.approval']);
        Route::put('homepage/urgent-cases', [HomepageUrgentCasesController::class, 'update'])
            ->middleware(['permission:homepage.update', 'editor.approval']);
        Route::patch('homepage-content', [HomePageContentController::class, 'update'])
            ->middleware(['permission:homepage.update', 'editor.approval']);

        Route::put('homepage/hero', [HomePageContentController::class, 'updateHero'])
            ->middleware(['permission:homepage.update', 'editor.approval']);
        Route::post('homepage/hero', [HomePageContentController::class, 'updateHero'])
            ->middleware(['permission:homepage.update', 'editor.approval']);
        Route::patch('homepage/hero', [HomePageContentController::class, 'updateHero'])
            ->middleware(['permission:homepage.update', 'editor.approval']);

        Route::put('homepage/content', [HomePageContentController::class, 'updateContent'])
            ->middleware(['permission:homepage.update', 'editor.approval']);
        Route::post('homepage/content', [HomePageContentController::class, 'updateContent'])
            ->middleware(['permission:homepage.update', 'editor.approval']);
        Route::patch('homepage/content', [HomePageContentController::class, 'updateContent'])
            ->middleware(['permission:homepage.update', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | About Us Admin
        |--------------------------------------------------------------------------
        */

        Route::get('admin/about-us', [AboutUsController::class, 'adminShow'])
            ->middleware('permission:about_us.view');

        Route::put('admin/about-us', [AboutUsController::class, 'update'])
            ->middleware(['permission:about_us.update', 'editor.approval']);

        foreach ([
            'hero',
            'stats',
            'programs',
            'trust',
            'why-us',
            'values',
            'story',
            'vision-2030',
        ] as $section) {
            Route::put("admin/about-us/{$section}", [AboutUsController::class, 'update'])
                ->middleware(['permission:about_us.update', 'editor.approval'])
                ->defaults('section', $section);
        }

        /*
        |--------------------------------------------------------------------------
        | Axes
        |--------------------------------------------------------------------------
        */

        Route::get('admin/axes', [AxisController::class, 'index'])
            ->middleware('permission:axes.view');
        Route::post('admin/axes', [AxisController::class, 'store'])
            ->middleware(['permission:axes.create', 'editor.approval']);
        Route::get('admin/axes/{axis}', [AxisController::class, 'show'])
            ->middleware('permission:axes.view');
        Route::put('admin/axes/{axis}', [AxisController::class, 'update'])
            ->middleware(['permission:axes.update', 'editor.approval']);
        Route::patch('admin/axes/{axis}', [AxisController::class, 'update'])
            ->middleware(['permission:axes.update', 'editor.approval']);
        Route::delete('admin/axes/{axis}', [AxisController::class, 'destroy'])
            ->middleware(['permission:axes.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Seasons
        |--------------------------------------------------------------------------
        */

        Route::post('seasons', [SeasonController::class, 'store'])
            ->middleware(['permission:seasons.create', 'editor.approval']);
        Route::put('seasons/{season}', [SeasonController::class, 'update'])
            ->middleware(['permission:seasons.update', 'editor.approval']);
        Route::patch('seasons/{season}', [SeasonController::class, 'update'])
            ->middleware(['permission:seasons.update', 'editor.approval']);
        Route::delete('seasons/{season}', [SeasonController::class, 'destroy'])
            ->middleware(['permission:seasons.delete', 'editor.approval']);

        /*
        |--------------------------------------------------------------------------
        | Homepage Carousel
        |--------------------------------------------------------------------------
        */

        Route::get('admin/homepage/carousel', [HomepageCarouselController::class, 'adminIndex'])
            ->middleware('permission:homepage.view');

        Route::put('admin/homepage/carousel/settings', [HomepageCarouselController::class, 'updateSettings'])
            ->middleware('permission:homepage.update');

        Route::get('admin/homepage/carousel/items', [HomepageCarouselController::class, 'index'])
            ->middleware('permission:homepage.view');
        Route::post('admin/homepage/carousel/items', [HomepageCarouselController::class, 'store'])
            ->middleware('permission:homepage.update');
        Route::get('admin/homepage/carousel/items/{item}', [HomepageCarouselController::class, 'show'])
            ->middleware('permission:homepage.view');
        Route::put('admin/homepage/carousel/items/{item}', [HomepageCarouselController::class, 'update'])
            ->middleware('permission:homepage.update');
        Route::patch('admin/homepage/carousel/items/{item}', [HomepageCarouselController::class, 'update'])
            ->middleware('permission:homepage.update');
        Route::delete('admin/homepage/carousel/items/{item}', [HomepageCarouselController::class, 'destroy'])
            ->middleware('permission:homepage.update');
        Route::patch('admin/homepage/carousel/items/{item}/toggle', [HomepageCarouselController::class, 'toggle'])
            ->middleware('permission:homepage.update');
        Route::post('admin/homepage/carousel/reorder', [HomepageCarouselController::class, 'reorder'])
            ->middleware('permission:homepage.update');
    });
});