import React from "react";
import Input from "../../../components/ui/Input";

const CreateShop = () => {
  return (
    <div className="mt-3">
      <header class="mb-12 text-center">
        <h1 class="font-headline-lg text-headline-lg text-on-surface mb-4">
          Start Your Classroom Shop
        </h1>
        <p class="font-body-lg text-body-lg text-outline max-w-md mx-auto">
          Turn those outgrown uniforms and extra supplies into school credits in
          just three simple steps.
        </p>
      </header>

      {/* Shop Details */}

      <div class="bg-white rounded-lg shadow-xl p-10 relative overflow-hidden notebook-pattern border-2 border-teal-100">
        <form class="space-y-16">
          <div className="flex flex-col gap-y-6">
            <div className="flex w-full justify-between gap-4">
              {/* Left */}
              <div className="w-full flex flex-col gap-2">
                <span>First Name</span>
                <input
                  className="w-full bg-surface-container-low border-b-2 border-primary border-t-0 border-x-0 focus:ring-0 focus:border-primary-container text-2xl placeholder:text-outline-variant font-medium outline-none"
                  placeholder="e.g. Leo"
                  type="text"
                />
              </div>
              {/* Right */}
              <div className="w-full flex flex-col gap-2">
                <span>Surname</span>
                <input
                  className="w-full bg-surface-container-low border-b-2 border-primary border-t-0 border-x-0 focus:ring-0 focus:border-primary-container text-2xl placeholder:text-outline-variant font-medium outline-none"
                  placeholder="e.g. Doe"
                  type="text"
                />
              </div>
            </div>

            <div className="flex w-full justify-between gap-4">
              {/* Left */}
              <div className="w-full flex flex-col gap-2">
                <span>Shop Name</span>
                <input
                  className="w-full bg-surface-container-low border-b-2 border-primary border-t-0 border-x-0 focus:ring-0 focus:border-primary-container text-2xl placeholder:text-outline-variant font-medium outline-none"
                  placeholder="e.g. Leo's Closet"
                  type="text"
                />
              </div>
              {/* Right */}
              <div className="w-full flex flex-col gap-2">
                <span>Category</span>
                <select className="w-full bg-surface-container-low border-b-2 border-primary border-t-0 border-x-0 focus:ring-0 focus:border-primary-container text-2xl placeholder:text-outline-variant font-medium outline-none">
                  <option value="uniform">Shool Uniform</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Books">Books</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShop;
