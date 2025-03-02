import React from 'react';

const VisualHistory = () => {
  const images = [
    '/images/bfc-fans-visual-history-1.jpg',
    '/images/bfc-fans-visual-history-3.jpg',
    '/images/bfc-fans-visual-history-4.jpg',
    '/images/bfc-fans-visual-history-5.jpg',
    '/images/bfc-fans-visual-history-6.jpg',
    '/images/bfc-fans-visual-history-7.jpg',
    '/images/bfc-fans-visual-history-8.jpg',
    '/images/bfc-fans-visual-history-9.jpg',
    '/images/bfc-fans-visual-history-10.jpg'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Image */}
      <div className="relative mb-8">
        <img
          src="/images/bfc-fans-visual-history-header.jpg"
          alt="Barnsley FC: The People's Visual History"
          className="w-full h-auto max-h-[600px] object-contain"
        />
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-center mb-8">BARNSLEY FC: THE PEOPLE'S VISUAL HISTORY</h1>
        
        <div className="mb-8">
          <p className="text-lg mb-6">
            The people of Barnsley and all followers of Barnsley FC are invited to participate in a new project
            celebrating what it means to support their club.
          </p>

          <p className="text-lg mb-6">
            Do you have a photo of yourself, your friends or neighbours, or your mum or grandad at Oakwell, or at an away match, or with your favourite player? Or have you ever kept a scrapbook or a flag, banner, rosette, scarves, tickets or other mementos that are associated with the highs and lows of following Barnsley FC? Such items rarely get attention but collectively they form the people's visual history, offering a valuable and distinctive viewpoint into the connection between the club and the town it represents as well as the experience of being a fan.
          </p>

          <p className="text-lg mb-6">
            The project is being led by the renowned photographer and football artist Julian Germain who aims to produce the highest quality photographs of the items submitted so that they can be added to a digital archive and preserved for future generations to enjoy.
          </p>

          <p className="text-lg mb-6">
            A beautifully illustrated new book, Barnsley FC: The People's Visual History is scheduled to be published in November 2025.
          </p>

          <blockquote className="border-l-4 border-barnsley-red pl-4 italic my-8">
            "Perhaps you were one of the 6,000 Tykes fans at Anfield during the famous 5th round FA Cup win in 2008, and maybe you managed to take a few snaps? Or you were amongst the delirious promotion celebrations in 1997 after Clint Marcelle clinched the points against Bradford? Or did you cut your teeth as a BFC fan by enduring that seven year stretch in the old 4th Division (1972-79) when Oakwell crowds were often well below 5,000? Or, it could just be you proudly wearing a replica shirt and waving a banner or scarf in the back garden, simply because you love Barnsley Football Club? Fans have memories and stories and they often hold on to objects and items - all kinds of things - that in some way connect them to those experiences and to their sense of belonging to their team."
          </blockquote>
          <p className="text-right font-medium">Julian Germain</p>

          <div className="my-12">
            <p className="text-lg mb-6">
              This exciting project is supported by the BFC Fans Advisory Board and club sponsor Parliament, with the full support of Barnsley FC.
            </p>
            
            {/* Parliament Logo */}
            <div className="bg-black py-3 px-6 rounded shadow-md my-8 flex justify-center max-w-3xl mx-auto">
              <a 
                href="https://houseofparliament.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src="/images/parliament-logo.png"
                  alt="Parliament - Project Sponsor"
                  className="h-16 w-auto"
                />
              </a>
            </div>
          </div>

          <div className="space-y-8 my-12">
            <div>
              <blockquote className="border-l-4 border-barnsley-red pl-4 italic mb-4">
                "Barnsley FC is nothing without its supporters, and this project is a fantastic way to showcase our club's rich history from the fans' perspective. We want every fan, past and present, to dig deep and find those special items that connect them to their time following the Reds. Whether it's an old ticket stub, a scarf from a famous match, or a cherished photograph, every piece tells part of the story. Let's make sure these memories are preserved for future generations."
              </blockquote>
              <p className="text-right font-medium">Steve Brain, Vice Chair of the Fans Advisory Board</p>
            </div>

            <div>
              <blockquote className="border-l-4 border-barnsley-red pl-4 italic mb-4">
                "Football is more than just the game on the pitch—it's about the people, the memories, and the moments that make supporting Barnsley FC so special. This project gives fans the opportunity to share their personal stories and memorabilia, helping to create a lasting visual history of our club. If you've got something tucked away in a drawer or an album, now's the time to bring it forward and be part of this incredible archive."
              </blockquote>
              <p className="text-right font-medium">Paul Gallagher, Barnsley FC Supporters Trust & Fan Advisory Board Member</p>
            </div>
          </div>

          <p className="text-lg mb-6">
            Please get in touch via email{' '}
            <a href="mailto:fab@barnsleyfc.co.uk" className="text-barnsley-red hover:text-[#B31329]">
              fab@barnsleyfc.co.uk
            </a>
          </p>
        </div>

        {/* Image Gallery */}
        <div className="space-y-8 mt-12">
          {images.map((image, index) => (
            <div key={index} className="w-full">
              <img
                src={image}
                alt={`Visual History Image ${index + 1}`}
                className="w-full h-auto shadow-md hover:shadow-xl transition-shadow"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisualHistory; 