// Filename: meta-pixel-config.js

// আপনার পিক্সেল আইডি এখানে দেওয়া আছে। ভবিষ্যতে পরিবর্তনের জন্য শুধু এই একটি লাইন পরিবর্তন করলেই হবে।
const META_PIXEL_ID = '1475283116725734';

// Meta Pixel Base Code
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

// আপনার আইডি দিয়ে পিক্সেল চালু করা হলো
fbq('init', META_PIXEL_ID);

// প্রতিটি পেইজ লোড হওয়ার সাথে সাথে PageView ইভেন্ট ট্র্যাক করা হবে
fbq('track', 'PageView');