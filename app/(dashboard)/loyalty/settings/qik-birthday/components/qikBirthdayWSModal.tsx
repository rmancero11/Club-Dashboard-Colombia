import React, { useState } from 'react';
import Modal from 'react-modal';

function ExampleWSButton() {
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div>
      <button
        type={"button"}
        className="text-primary bg-primary text-white px-2 py-1 rounded-md mt-4 mb-8"
        onClick={openModal}
      >
        VER EJEMPLO
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Ejemplo Modal"
        className="bg-primary"
        overlayClassName="fixed inset-0 bg-black opacity-50"
      >
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Prueba Modal WHATSAPP</h2>
          <button
            className="text-white bg-primary px-4 py-2 rounded-md"
            onClick={closeModal}
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ExampleWSButton;
