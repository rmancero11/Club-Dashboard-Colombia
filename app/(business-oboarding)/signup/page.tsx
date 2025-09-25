'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { qikBenefits } from './constants';
import SignupForm from '../../components/signup/SignupForm';
import { Parser } from 'html-to-react';

const SignUpPage = () => {
  const textToHTML = (text: string) => {
    const htmlParser = Parser();
    return htmlParser.parse(text);
  };

  return (
    <div className="flex-1">
      <main className="container mx-auto">
        <div className="flex lg:flex-row flex-col items-center justify-start lg:pt-0 gap-8">
          <div className="flex flex-col justify-center items-center lg:w-1/2 w-full lg:px-8 gap-4 lg:py-8">
            <div
              className="w-full h-52 rounded-3xl bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/signup-waiter.webp)' }}
            />
            <Image
              className="w-[500px] object-scale-down"
              src="/qikstarts-logo.webp"
              alt="Qikstarts"
              width={300}
              height={300}
            />
            <div className="flex flex-col items-center gap-1">
              <p className="text-primary font-medium text-xl">
                ¡Inicia tus 7 días gratis!
              </p>
              <span className="flex">
                <Icon
                  className="text-primary min-w-[2rem] w-8"
                  icon={'material-symbols:credit-card-off'}
                  fontSize={16}
                />
                <p className="text-sm">No necesitarás tarjeta de crédito</p>
              </span>
            </div>
            <div className="rounded-2xl border border-primary p-3">
              <ul className="flex flex-col gap-2 list-none">
                {qikBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Icon
                      className="text-primary min-w-[2rem] w-8"
                      icon={benefit.iconName}
                      fontSize={benefit.iconSize || 30}
                    />
                    <p className="font-normal text-gray-600">
                      {textToHTML(benefit.description)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="lg:px-8">
            <SignupForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;
