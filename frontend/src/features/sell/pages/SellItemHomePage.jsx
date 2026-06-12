import React from "react";
import { icons } from "../../../assets/icon/icons";
import { useNavigate } from "react-router-dom";

const SellItemHomePage = () => {
  const navigate = useNavigate()
  return (
    <div className="mt-3">
      <div className="bg-white rounded-lg p-12 text-center border-4 border-white sticker-shadow mb-12 relative overflow-hidden">
        <div class="mb-8 flex justify-center">
          <div class="relative w-64 h-64 bg-surface-container rounded-full flex items-center justify-center border-4 border-dashed border-teal-200">
            <img
              alt="School Backpack Illustration"
              class="w-48 h-48 object-contain drop-shadow-xl"
              alt="A playful, hand-drawn style illustration of a vibrant school backpack bursting with colorful school supplies like pencils, rulers, and a friendly-looking apple. The backpack is teal and yellow, sitting on a soft-textured background with subtle notebook grid patterns. The lighting is warm and inviting, evoking a sense of childhood nostalgia and the excitement of a new school term."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbnRD3OBQfmcAA1m-h5wrxkp9RcjYWO2UO54pTG7y4E-Wk6Jyc32Xc3KMXYZxf83TCZkdNWgCdWCbN-LShYjUzpZ3QmN58RIhbT3mRs17_RzTBAZuv2fxfrvShBbEs5pN-aoXGDcUBGG9gicYu6Tk8danM7BIiCuCwuFuC8w6VEKxZxIMl7U964KiOPFJkEK_gFKgRMoFzKRXhEFYUHWGgpHUFKnr3bZ_Fhjt3x9BI77UrH3EpmRwj0mfNnRzhpRPBIhWD_5a30Fo"
            />
            {/* <span class="material-symbols-outlined absolute top-4 left-4 text-primary text-4xl opacity-20">
              star
            </span>
            <span class="material-symbols-outlined absolute bottom-10 right-4 text-secondary text-4xl opacity-20">
              auto_awesome
            </span> */}
          </div>
        </div>
        <h1 class="font-headline-lg text-primary mb-4">
          Ready to Open Your Classroom Stall?
        </h1>
        <p class="font-body-lg text-slate-600 mb-10 max-w-lg mx-auto">
          Turn your unused supplies into school credits! Create your digital
          stall in just a few clicks and join the most vibrant student
          marketplace.
        </p>
        <button class="px-10 py-5 bg-primary text-white font-headline-md rounded-full button-depth transition-all flex items-center gap-3 mx-auto" onClick={() => navigate('/sell/create')}>
          <img src={icons.active_home_icon} alt="" />
          Create Your Shop
        </button>
      </div>

      <h3 class="font-headline-md text-primary mb-6 flex items-center gap-2">
        <span class="bg-secondary-container text-on-secondary-container w-10 h-10 rounded-full flex items-center justify-center -rotate-3 sticker-shadow">
          A
        </span>
        Simple as ABC
      </h3>

      {/* Cards */}

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-lg border-2 border-surface-container sticker-shadow transform rotate-1 transition-transform hover:rotate-0">
          <div class="w-12 h-12 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mb-6 border-2 border-teal-100">
            <img src={icons.set_profile_icon} alt="Set Profile" />
          </div>
          <h4 class="font-bold text-lg mb-2">1. Set up your profile</h4>
          <p class="text-sm text-slate-500 leading-relaxed">
            Choose a cool name for your stall and add a friendly avatar to let
            buyers know who you are.
          </p>
        </div>
        {/* Step 2 */}

        <div class="bg-white p-8 rounded-lg border-2 border-surface-container sticker-shadow transform -rotate-1 transition-transform hover:rotate-0">
          <div class="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center mb-6 border-2 border-yellow-200">
            <img src={icons.add_item_icon} alt="Add Item" />
          </div>
          <h4 class="font-bold text-lg mb-2">2. Add your first item</h4>
          <p class="text-sm text-slate-500 leading-relaxed">
            Snap a photo of your item, set a price, and write a quick
            description. It's that easy!
          </p>
        </div>

        {/* Step 3 */}

        <div class="bg-white p-8 rounded-lg border-2 border-surface-container sticker-shadow transform rotate-2 transition-transform hover:rotate-0">
          <div class="w-12 h-12 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-6 border-2 border-teal-300">
            <img src={icons.earning_icon} alt="Earning" />
          </div>
          <h4 class="font-bold text-lg mb-2">3. Start earning</h4>
          <p class="text-sm text-slate-500 leading-relaxed">
            Once buyers claim your items, you'll earn credits to spend on other
            cool stuff in the market.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellItemHomePage;
