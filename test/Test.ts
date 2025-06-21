import assert from "assert";
import { 
  TestHelpers,
  NadPay_PaymentLinkCreated
} from "generated";
const { MockDb, NadPay } = TestHelpers;

describe("NadPay contract PaymentLinkCreated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for NadPay contract PaymentLinkCreated event
  const event = NadPay.PaymentLinkCreated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("NadPay_PaymentLinkCreated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await NadPay.PaymentLinkCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualNadPayPaymentLinkCreated = mockDbUpdated.entities.NadPay_PaymentLinkCreated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedNadPayPaymentLinkCreated: NadPay_PaymentLinkCreated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      linkId: event.params.linkId,
      creator: event.params.creator,
      price: event.params.price,
      title: event.params.title,
      description: event.params.description,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualNadPayPaymentLinkCreated, expectedNadPayPaymentLinkCreated, "Actual NadPayPaymentLinkCreated should be the same as the expectedNadPayPaymentLinkCreated");
  });
});
