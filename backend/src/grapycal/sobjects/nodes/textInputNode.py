from typing import Any, Dict
from grapycal.sobjects.edge import Edge
from grapycal.sobjects.node import Node
from grapycal.sobjects.port import InputPort, OutputPort
from objectsync import StringTopic

class TextInputNode(Node):
    frontend_type = 'TextInputNode'
    def pre_build(self, attribute_values: Dict[str, Any] | None, workspace):
        super().pre_build(attribute_values, workspace)
        self.text = self.add_attribute('text', StringTopic, 'text')
        self.text.on_set += lambda new_value: self.activate() # eager activation

    def build(self):
        super().build()
        self.out_port = self.add_out_port('out')
        self.label.set('ㄅ')


    def activate(self):
        for edge in self.out_port.edges:
            edge.push_data(self.text.get())

    def output_edge_added(self, edge: Edge, port: OutputPort):
        edge.push_data(self.text.get())# eager activation
        print('input_edge_added')