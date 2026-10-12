// Hub redesign PR 2 content model. Run with:
//   make content-migration FILE=contentful/migrations/2026-10-12-hub-content-models.cjs
module.exports = function( migration ) {
  const servicePackage = migration.createContentType( "servicePackage" )
    .name( "Service package" )
    .displayField( "name" )
    .description( "One row in an Events price list" );
  servicePackage.createField( "name" ).name( "Name" ).type( "Symbol" ).required( true );
  servicePackage.createField( "group" ).name( "Group" ).type( "Symbol" ).required( true )
    .validations( [ { in: [ "dj", "speakerRental" ] } ] );
  servicePackage.createField( "price" ).name( "Price (whole dollars)" ).type( "Integer" ).required( true );
  servicePackage.createField( "priceOperated" ).name( "Price with the owner running sound (rentals)" ).type( "Integer" );
  servicePackage.createField( "priceUnit" ).name( "Price unit" ).type( "Symbol" ).required( true );
  servicePackage.createField( "includes" ).name( "Includes" ).type( "Array" ).items({ type: "Symbol" });

  const categoryLanding = migration.createContentType( "categoryLanding" )
    .name( "Category landing" )
    .displayField( "category" )
    .description( "Evergreen copy above a category archive" );
  categoryLanding.createField( "category" ).name( "Category" ).type( "Symbol" ).required( true )
    .validations( [ { unique: true }, { in: [ "music", "events", "lifestyle" ] } ] );
  categoryLanding.createField( "description" ).name( "Search description" ).type( "Text" ).required( true );
  categoryLanding.createField( "intro" ).name( "Intro (markdown)" ).type( "Text" );
  categoryLanding.createField( "body" ).name( "Body (markdown)" ).type( "Text" );
  categoryLanding.createField( "packages" ).name( "Packages" ).type( "Array" )
    .items({ type: "Link", linkType: "Entry", validations: [ { linkContentType: [ "servicePackage" ] } ] });
  categoryLanding.createField( "rentalHeading" ).name( "Rental heading" ).type( "Symbol" );
  categoryLanding.createField( "footnote" ).name( "Footnote" ).type( "Symbol" );
  categoryLanding.createField( "ctaLabel" ).name( "Booking link label" ).type( "Symbol" );
  categoryLanding.createField( "ctaUrl" ).name( "Booking link URL" ).type( "Symbol" );
  categoryLanding.createField( "ogImage" ).name( "Social image" ).type( "Link" ).linkType( "Asset" );

  const homePage = migration.createContentType( "homePage" )
    .name( "Home page" )
    .displayField( "seoTitle" )
    .description( "Single entry: the home page's stacked lines and SEO" );
  homePage.createField( "seoTitle" ).name( "Page title" ).type( "Symbol" ).required( true );
  homePage.createField( "seoDescription" ).name( "Meta description" ).type( "Text" ).required( true );
  homePage.createField( "lines" ).name( "Stacked lines" ).type( "Array" ).items({ type: "Symbol" });
  homePage.createField( "showNowPlaying" ).name( "Show the live now-playing line" ).type( "Boolean" ).required( true );
  homePage.createField( "hireLinkLabel" ).name( "Hire link label" ).type( "Symbol" ).required( true );

  const brand = migration.createContentType( "brand" )
    .name( "Brand" )
    .displayField( "name" )
    .description( "A brand shown on the About page (used in PR 3)" );
  brand.createField( "name" ).name( "Name" ).type( "Symbol" ).required( true );
  brand.createField( "kind" ).name( "Kind" ).type( "Symbol" );
  brand.createField( "blurb" ).name( "Blurb" ).type( "Text" );
  brand.createField( "url" ).name( "URL" ).type( "Symbol" );
  brand.createField( "logo" ).name( "Logo" ).type( "Link" ).linkType( "Asset" );

  const author = migration.editContentType( "author" );
  author.createField( "resumeUrl" ).name( "Resume URL" ).type( "Symbol" );
  author.createField( "brands" ).name( "Brands" ).type( "Array" )
    .items({ type: "Link", linkType: "Entry", validations: [ { linkContentType: [ "brand" ] } ] });
};
